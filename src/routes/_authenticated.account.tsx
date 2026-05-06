import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { authedFetch } from "@/lib/auth-helpers";

export const Route = createFileRoute("/_authenticated/account")({
  component: AccountPage,
  head: () => ({ meta: [{ title: "Account — AskDerivn" }] }),
});

function AccountPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) return;
      setEmail(s.session.user.email ?? null);
      const { data } = await supabase
        .from("profiles")
        .select("subscription_status, subscription_current_period_end")
        .eq("id", s.session.user.id)
        .single();
      setStatus(data?.subscription_status ?? null);
      setPeriodEnd(data?.subscription_current_period_end ?? null);
    })();
  }, []);

  const openPortal = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authedFetch("/api/portal", { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      const { url } = await res.json();
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open portal");
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <main className="mx-auto max-w-2xl px-6 pt-20 pb-24">
      <h1 className="font-serif text-4xl tracking-tight">Account</h1>

      <dl className="mt-10 space-y-6 text-sm">
        <Row label="Email" value={email ?? "—"} />
        <Row label="Membership" value={status ?? "inactive"} />
        {periodEnd && (
          <Row
            label="Renews / ends"
            value={new Date(periodEnd).toLocaleDateString()}
          />
        )}
      </dl>

      {error && <p className="mt-6 text-sm text-red-700">{error}</p>}

      <div className="mt-10 space-y-3">
        <button
          onClick={openPortal}
          disabled={loading}
          className="w-full rounded-sm border border-rule px-6 py-3 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50"
        >
          {loading ? "Opening…" : "Manage billing"}
        </button>
        <button
          onClick={signOut}
          className="w-full rounded-sm border border-rule px-6 py-3 text-sm font-medium text-foreground hover:bg-accent"
        >
          Sign out
        </button>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-rule pb-3">
      <dt className="font-mono text-xs uppercase tracking-wider text-ink-soft">
        {label}
      </dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}
