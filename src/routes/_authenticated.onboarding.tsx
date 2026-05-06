import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
  strength_days_per_week: string;
  cardio_days_per_week: string;
  time_per_session: string;
  equipment: string;
  limitations: string;
  pain_notes: string;
  nutrition_context: string;
  other_notes: string;
};

const empty: Form = {
  display_name: "",
  goal: "",
  training_level: "",
  weekly_schedule: "",
  strength_days_per_week: "",
  cardio_days_per_week: "",
  time_per_session: "",
  equipment: "",
  limitations: "",
  pain_notes: "",
  nutrition_context: "",
  other_notes: "",
};

function OnboardingPage() {
  const navigate = useNavigate();
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
          "display_name, goal, training_level, weekly_schedule, strength_days_per_week, cardio_days_per_week, time_per_session, equipment, limitations, pain_notes, nutrition_context, other_notes"
        )
        .eq("id", s.session.user.id)
        .single();
      if (data) {
        setForm({
          display_name: data.display_name ?? "",
          goal: data.goal ?? "",
          training_level: data.training_level ?? "",
          weekly_schedule: data.weekly_schedule ?? "",
          strength_days_per_week:
            data.strength_days_per_week != null
              ? String(data.strength_days_per_week)
              : "",
          cardio_days_per_week:
            data.cardio_days_per_week != null
              ? String(data.cardio_days_per_week)
              : "",
          time_per_session: data.time_per_session ?? "",
          equipment: data.equipment ?? "",
          limitations: data.limitations ?? "",
          pain_notes: data.pain_notes ?? "",
          nutrition_context: data.nutrition_context ?? "",
          other_notes: data.other_notes ?? "",
        });
      }
      setLoading(false);
    })();
  }, []);

  const set =
    (k: keyof Form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) return;

    const update = {
      display_name: form.display_name || null,
      goal: form.goal || null,
      training_level: form.training_level || null,
      weekly_schedule: form.weekly_schedule || null,
      strength_days_per_week: form.strength_days_per_week
        ? Number(form.strength_days_per_week)
        : null,
      cardio_days_per_week: form.cardio_days_per_week
        ? Number(form.cardio_days_per_week)
        : null,
      time_per_session: form.time_per_session || null,
      equipment: form.equipment || null,
      limitations: form.limitations || null,
      pain_notes: form.pain_notes || null,
      nutrition_context: form.nutrition_context || null,
      other_notes: form.other_notes || null,
      profile_completed_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("profiles")
      .update(update)
      .eq("id", s.session.user.id);
    setSaving(false);
    if (error) setError(error.message);
    else {
      setSaved(true);
      navigate({ to: "/chat" });
    }
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
          <Input value={form.display_name} onChange={set("display_name")} />
        </Row>
        <Row label="Main goal">
          <Input
            placeholder="e.g. Run a sub-1:30 half marathon"
            value={form.goal}
            onChange={set("goal")}
          />
        </Row>
        <Row label="Training level">
          <Input
            placeholder="Beginner / Intermediate / Advanced"
            value={form.training_level}
            onChange={set("training_level")}
          />
        </Row>
        <Row label="Strength days per week">
          <Input
            type="number"
            min={0}
            max={7}
            value={form.strength_days_per_week}
            onChange={set("strength_days_per_week")}
          />
        </Row>
        <Row label="Running / cardio days per week">
          <Input
            type="number"
            min={0}
            max={7}
            value={form.cardio_days_per_week}
            onChange={set("cardio_days_per_week")}
          />
        </Row>
        <Row label="Time available per session">
          <Input
            placeholder="e.g. 45–60 min"
            value={form.time_per_session}
            onChange={set("time_per_session")}
          />
        </Row>
        <Row label="Weekly schedule notes">
          <Input
            placeholder="e.g. Weekday mornings, long run Saturdays"
            value={form.weekly_schedule}
            onChange={set("weekly_schedule")}
          />
        </Row>
        <Row label="Equipment">
          <Input
            placeholder="e.g. Full gym, dumbbells only, bodyweight"
            value={form.equipment}
            onChange={set("equipment")}
          />
        </Row>
        <Row label="Limitations">
          <Textarea value={form.limitations} onChange={set("limitations")} />
        </Row>
        <Row label="Pain or injury notes">
          <Textarea value={form.pain_notes} onChange={set("pain_notes")} />
        </Row>
        <Row label="Nutrition context">
          <Textarea
            value={form.nutrition_context}
            onChange={set("nutrition_context")}
            placeholder="Eating patterns, dietary preferences, supplements"
          />
        </Row>
        <Row label="Anything else AskDerivn should know">
          <Textarea value={form.other_notes} onChange={set("other_notes")} />
        </Row>

        {error && <p className="text-sm text-red-700">{error}</p>}
        {saved && <p className="text-sm text-ink-soft">Saved.</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-sm bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save and continue"}
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

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full border-b border-rule bg-transparent py-2 text-sm outline-none focus:border-foreground"
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={3}
      {...props}
      className="w-full border-b border-rule bg-transparent py-2 text-sm outline-none focus:border-foreground"
    />
  );
}
