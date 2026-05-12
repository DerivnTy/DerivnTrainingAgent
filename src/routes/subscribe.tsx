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
      const body = (await res.json()) as {
        url?: string;
        alreadyActive?: boolean;
      };
      if (body.alreadyActive) {
        navigate({ to: "/post-auth" });
        return;
      }
      if (!body.url) throw new Error("No checkout URL returned");
      window.location.href = body.url;
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
          <Link to="/" className="t-wordmark">AskDerivn</Link>
          <button
            type="button"
            onClick={onSignOut}
            className="t-body-sm text-link hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-6 pt-20 pb-24">
        <h1 className="t-h1">
          AskDerivn Membership
        </h1>
        <div className="mt-6 flex items-baseline gap-2">
          <span className="font-serif text-3xl tracking-tight md:text-4xl">$30</span>
          <span className="t-body-sm">/month</span>
        </div>
        <p className="mt-2 t-body-sm">Cancel anytime.</p>

        <ul className="mt-10 space-y-3 t-body-sm">
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
            type="button"
            onClick={onStart}
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "Starting…" : "Start membership"}
          </button>
          {error && <p className="t-error">{error}</p>}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
