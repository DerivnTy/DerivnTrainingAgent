import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  resolvePostAuthDestination,
  waitForSession,
} from "@/lib/post-auth-route";

export const Route = createFileRoute("/post-auth")({
  component: PostAuthPage,
  head: () => ({ meta: [{ title: "Loading — AskDerivn" }] }),
});

function PostAuthPage() {
  const navigate = useNavigate();
  const [msg] = useState("Loading your account…");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = await waitForSession();
      if (cancelled) return;
      if (!session) {
        navigate({ to: "/login" });
        return;
      }
      const dest = await resolvePostAuthDestination(
        session.user.id,
        session.user.email
      );
      if (cancelled) return;
      navigate({ to: dest });
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="flex items-center gap-3 text-sm text-ink-soft">
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-ink-soft" />
        <span>{msg}</span>
      </div>
    </div>
  );
}
