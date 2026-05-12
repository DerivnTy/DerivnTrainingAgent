import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  resolvePostAuthDestination,
  waitForSession,
} from "@/lib/post-auth-route";
import { authedFetch } from "@/lib/auth-helpers";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/post-auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    checkout: typeof s.checkout === "string" ? s.checkout : undefined,
  }),
  component: PostAuthPage,
  head: () => ({ meta: [{ title: "Loading — AskDerivn" }] }),
});

async function waitForActiveSubscription(
  userId: string,
  maxTries = 12,
  delayMs = 750
): Promise<boolean> {
  for (let i = 0; i < maxTries; i++) {
    const { data } = await supabase
      .from("profiles")
      .select("subscription_status, subscription_current_period_end")
      .eq("id", userId)
      .single();
    if (data?.subscription_status === "active") {
      const end = data.subscription_current_period_end
        ? new Date(data.subscription_current_period_end)
        : null;
      if (!end || end.getTime() > Date.now()) return true;
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}

function PostAuthPage() {
  const navigate = useNavigate();
  const { checkout } = Route.useSearch();
  const [msg, setMsg] = useState("Loading your account…");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = await waitForSession();
      if (cancelled) return;
      if (!session) {
        navigate({ to: "/login" });
        return;
      }

      // Coming back from Stripe checkout — webhook may not have fired yet.
      // Poll for the subscription to become active before deciding the route.
      if (checkout === "success") {
        setMsg("Confirming your membership…");
        await waitForActiveSubscription(session.user.id);
        if (cancelled) return;
      }

      const dest = await resolvePostAuthDestination(
        session.user.id,
        session.user.email
      );
      if (cancelled) return;

      if (dest === "/subscribe") {
        setMsg("Taking you to checkout…");
        try {
          const res = await authedFetch("/api/checkout", { method: "POST" });
          if (!res.ok) throw new Error(await res.text());
          const body = (await res.json()) as {
            url?: string;
            alreadyActive?: boolean;
          };
          if (body.alreadyActive) {
            const next = await resolvePostAuthDestination(
              session.user.id,
              session.user.email
            );
            if (cancelled) return;
            navigate({ to: next === "/subscribe" ? "/chat" : next });
            return;
          }
          if (!body.url) throw new Error("No checkout URL");
          window.location.href = body.url;
          return;
        } catch (e) {
          console.error("checkout redirect failed", e);
          if (cancelled) return;
          navigate({ to: "/subscribe" });
          return;
        }
      }

      navigate({ to: dest });

    })();
    return () => {
      cancelled = true;
    };
  }, [navigate, checkout]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="flex items-center gap-3 t-body-sm">
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-ink-soft" />
        <span>{msg}</span>
      </div>
    </div>
  );
}
