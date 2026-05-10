import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  resolvePostAuthDestination,
  waitForSession,
} from "@/lib/post-auth-route";
import { authedFetch } from "@/lib/auth-helpers";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/post-auth")({
  component: PostAuthPage,
  head: () => ({ meta: [{ title: "Loading — AskDerivn" }] }),
});

function PostAuthPage() {
  const navigate = useNavigate();
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

      // OAuth intent guard: if the user came from /login via Google/Apple but
      // no account existed before, Supabase will have auto-created one. Detect
      // that and bounce them back with a friendly message.
      const intent =
        typeof window !== "undefined"
          ? window.sessionStorage.getItem("oauth_intent")
          : null;
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("oauth_intent");
      }
      if (intent === "login") {
        const createdAt = session.user.created_at
          ? new Date(session.user.created_at).getTime()
          : 0;
        const isBrandNew = createdAt > 0 && Date.now() - createdAt < 60_000;
        if (isBrandNew) {
          await supabase.auth.signOut();
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem(
              "auth_error",
              "I don't see an account for that login. Try signing up first."
            );
          }
          navigate({ to: "/login" });
          return;
        }
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
          const { url } = await res.json();
          if (!url) throw new Error("No checkout URL");
          window.location.href = url;
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
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="flex items-center gap-3 t-body-sm">
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-ink-soft" />
        <span>{msg}</span>
      </div>
    </div>
  );
}
