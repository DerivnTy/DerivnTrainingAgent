import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { authedFetch } from "@/lib/auth-helpers";
import { subscribeBeforeLoad } from "@/lib/post-auth-route";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/subscribe")({
  beforeLoad: () => subscribeBeforeLoad(),
  component: SubscribePage,
  head: () => ({ meta: [{ title: "Membership — AskDerivn" }] }),
});

const VALUE_ITEMS = [
  "AskDerivn chat access",
  "100-page Built for Motion PDF",
  "Saved conversations",
  "Personalized profile context",
  "Derivn-system-guided answers",
];

function SubscribePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onStart = async () => {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await authedFetch("/api/checkout", { method: "POST" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Could not start checkout");
      }
      const { url } = await res.json();
      if (!url) throw new Error("No checkout URL returned");
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start checkout");
      setLoading(false);
    }
  };

  const onSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-rule">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <span className="font-serif text-lg tracking-tight">AskDerivn</span>
          <button
            onClick={onSignOut}
            className="text-sm text-ink-soft text-link hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-6 pt-20 pb-24">
        <h1 className="font-serif text-4xl tracking-tight">
          AskDerivn Membership
        </h1>
        <div className="mt-6 flex items-baseline gap-2">
          <span className="font-serif text-5xl tracking-tight">$30</span>
          <span className="text-sm text-ink-soft">/month</span>
        </div>
        <p className="mt-2 text-sm text-ink-soft">Cancel anytime.</p>

        <ul className="mt-10 space-y-3 text-sm">
          {VALUE_ITEMS.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span
                aria-hidden
                className="mt-2 inline-block h-1 w-1 rounded-full bg-foreground"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-10 space-y-3">
          <button
            onClick={onStart}
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "Starting…" : "Start membership"}
          </button>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button
            onClick={onSignOut}
            className="btn-secondary w-full"
            disabled={loading}
          >
            Sign out
          </button>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
