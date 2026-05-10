import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  resolvePostAuthDestination,
  waitForSession,
} from "@/lib/post-auth-route";
import { authedFetch } from "@/lib/auth-helpers";

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
