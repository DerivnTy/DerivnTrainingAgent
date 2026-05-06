import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
      // Wait briefly for session to hydrate (especially after OAuth redirect)
      let session = (await supabase.auth.getSession()).data.session;
      for (let i = 0; i < 10 && !session; i++) {
        await new Promise((r) => setTimeout(r, 200));
        session = (await supabase.auth.getSession()).data.session;
      }
      if (cancelled) return;
      if (!session) {
        navigate({ to: "/login" });
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select(
          "subscription_status, subscription_current_period_end, profile_completed_at, goal"
        )
        .eq("id", session.user.id)
        .single();

      if (cancelled) return;
      if (error) {
        setMsg("Could not load your account.");
        return;
      }
      const active =
        profile?.subscription_status === "active" &&
        (!profile.subscription_current_period_end ||
          new Date(profile.subscription_current_period_end) > new Date());
      if (!active) {
        navigate({ to: "/subscribe" });
        return;
      }
      const profileComplete =
        Boolean(profile?.profile_completed_at) || Boolean(profile?.goal);
      navigate({ to: profileComplete ? "/chat" : "/onboarding" });
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <p className="text-sm text-ink-soft">{msg}</p>
    </div>
  );
}
