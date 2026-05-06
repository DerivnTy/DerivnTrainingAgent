import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { authedFetch } from "@/lib/auth-helpers";

export const Route = createFileRoute("/_authenticated/subscribe")({
  component: SubscribePage,
  head: () => ({ meta: [{ title: "Membership — AskDerivn" }] }),
});

function SubscribePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subscribe = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authedFetch("/api/checkout", { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      const { url } = await res.json();
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start checkout");
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <main className="mx-auto max-w-2xl px-6 pt-20 pb-24">
      <h1 className="font-serif text-5xl tracking-tight">AskDerivn Membership</h1>
      <p className="mt-4 text-lg text-ink-soft">$50 / month</p>

      <ul className="mt-10 space-y-3 text-sm">
        {[
          "AskDerivn assistant access",
          "Built for Motion PDF",
          "Saved conversations",
          "Personalized profile context",
          "Derivn-system-guided answers",
        ].map((item) => (
          <li key={item} className="flex items-start gap-3">
            <span className="mt-2 h-1 w-1 rounded-full bg-foreground" />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      {error && <p className="mt-6 text-sm text-red-700">{error}</p>}

      <button
        onClick={subscribe}
        disabled={loading}
        className="mt-10 w-full rounded-sm bg-primary px-6 py-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Starting checkout…" : "Subscribe — $50 / month"}
      </button>

      <button
        onClick={signOut}
        className="mt-6 text-sm text-ink-soft underline-offset-4 hover:text-foreground hover:underline"
      >
        Sign out
      </button>
    </main>
  );
}
