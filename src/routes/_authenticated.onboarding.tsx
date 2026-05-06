import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingPage,
  head: () => ({ meta: [{ title: "Profile — AskDerivn" }] }),
});

type Form = {
  display_name: string;
  goal: string;
  training_level: string;
  weekly_schedule: string;
  equipment: string;
  limitations: string;
};

const empty: Form = {
  display_name: "",
  goal: "",
  training_level: "",
  weekly_schedule: "",
  equipment: "",
  limitations: "",
};

function OnboardingPage() {
  const [form, setForm] = useState<Form>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) return;
      const { data } = await supabase
        .from("profiles")
        .select(
          "display_name, goal, training_level, weekly_schedule, equipment, limitations"
        )
        .eq("id", s.session.user.id)
        .single();
      if (data) {
        setForm({
          display_name: data.display_name ?? "",
          goal: data.goal ?? "",
          training_level: data.training_level ?? "",
          weekly_schedule: data.weekly_schedule ?? "",
          equipment: data.equipment ?? "",
          limitations: data.limitations ?? "",
        });
      }
      setLoading(false);
    })();
  }, []);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) return;
    const { error } = await supabase
      .from("profiles")
      .update(form)
      .eq("id", s.session.user.id);
    setSaving(false);
    if (error) setError(error.message);
    else setSaved(true);
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-6 pt-20 pb-24">
        <p className="text-sm text-ink-soft">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 pt-20 pb-24">
      <h1 className="font-serif text-4xl tracking-tight">Your profile</h1>
      <p className="mt-3 text-sm text-ink-soft">
        Context AskDerivn uses when answering your questions.
      </p>

      <form onSubmit={onSubmit} className="mt-10 space-y-6">
        <Row label="Name">
          <input
            value={form.display_name}
            onChange={set("display_name")}
            className="w-full border-b border-rule bg-transparent py-2 text-sm outline-none focus:border-foreground"
          />
        </Row>
        <Row label="Primary goal">
          <input
            placeholder="e.g. Run a sub-1:30 half marathon"
            value={form.goal}
            onChange={set("goal")}
            className="w-full border-b border-rule bg-transparent py-2 text-sm outline-none focus:border-foreground"
          />
        </Row>
        <Row label="Training level">
          <input
            placeholder="Beginner / Intermediate / Advanced"
            value={form.training_level}
            onChange={set("training_level")}
            className="w-full border-b border-rule bg-transparent py-2 text-sm outline-none focus:border-foreground"
          />
        </Row>
        <Row label="Weekly schedule">
          <input
            placeholder="e.g. 4 sessions, 60 min each, weekday mornings"
            value={form.weekly_schedule}
            onChange={set("weekly_schedule")}
            className="w-full border-b border-rule bg-transparent py-2 text-sm outline-none focus:border-foreground"
          />
        </Row>
        <Row label="Equipment">
          <input
            placeholder="e.g. Full gym, dumbbells only, bodyweight"
            value={form.equipment}
            onChange={set("equipment")}
            className="w-full border-b border-rule bg-transparent py-2 text-sm outline-none focus:border-foreground"
          />
        </Row>
        <Row label="Limitations or injuries">
          <textarea
            rows={3}
            value={form.limitations}
            onChange={set("limitations")}
            className="w-full border-b border-rule bg-transparent py-2 text-sm outline-none focus:border-foreground"
          />
        </Row>

        {error && <p className="text-sm text-red-700">{error}</p>}
        {saved && <p className="text-sm text-ink-soft">Saved.</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-sm bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
    </main>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block font-mono text-xs uppercase tracking-wider text-ink-soft">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
