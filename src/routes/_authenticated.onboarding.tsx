import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingPage,
  head: () => ({ meta: [{ title: "Set your context — AskDerivn" }] }),
});

const GOAL_OPTIONS = [
  "Fat loss",
  "Strength",
  "Running/cardio",
  "Hybrid fitness",
  "Consistency",
  "General health",
  "Returning after time off",
];

const LEVEL_OPTIONS = [
  "Beginner",
  "Returning after time off",
  "Intermediate",
  "Advanced",
];

const TIME_OPTIONS = ["20–30 min", "45–60 min", "60+ min", "Varies"];

const EQUIPMENT_OPTIONS = [
  "Commercial gym",
  "Home gym",
  "Dumbbells only",
  "Bodyweight only",
  "Mixed access",
  "Not sure yet",
];

const BARRIER_OPTIONS = [
  "Time",
  "Motivation",
  "Nutrition",
  "Recovery",
  "Stress",
  "Pain or injury",
  "Lack of structure",
  "Not knowing what to do",
  "Travel or schedule changes",
];

const NUTRITION_OPTIONS = [
  "No structure",
  "Generally healthy but inconsistent",
  "Track calories/macros",
  "Focus mostly on protein",
  "Struggle with weekends",
  "Struggle with snacking",
  "Struggle with eating enough",
  "Not sure",
];

const GUIDANCE_OPTIONS = [
  "Tell me what to do next",
  "Help me understand why",
  "Help me stay consistent",
  "Help me troubleshoot plateaus",
  "Help me plan my week",
  "Help me make better food choices",
  "Help me balance lifting and running",
];

type Form = {
  goal: string[];
  training_level: string;
  strength_days_per_week: string;
  cardio_days_per_week: string;
  average_steps: string;
  time_per_session: string;
  equipment: string;
  main_barriers: string[];
  pain_or_injury_flag: boolean | null;
  pain_notes: string;
  nutrition_tags: string[];
  guidance_preference: string[];
  other_notes: string;
};

const empty: Form = {
  goal: [],
  training_level: "",
  strength_days_per_week: "",
  cardio_days_per_week: "",
  average_steps: "",
  time_per_session: "",
  equipment: "",
  main_barriers: [],
  pain_or_injury_flag: null,
  pain_notes: "",
  nutrition_tags: [],
  guidance_preference: [],
  other_notes: "",
};

function OnboardingPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) return;
      const { data } = await supabase
        .from("profiles")
        .select(
          "goal, training_level, strength_days_per_week, cardio_days_per_week, average_steps, time_per_session, equipment, main_barriers, pain_or_injury_flag, pain_notes, nutrition_tags, guidance_preference, other_notes"
        )
        .eq("id", s.session.user.id)
        .single();
      if (data) {
        setForm({
          goal: data.goal
            ? data.goal.split(",").map((g: string) => g.trim()).filter(Boolean)
            : [],
          training_level: data.training_level ?? "",
          strength_days_per_week:
            data.strength_days_per_week != null
              ? String(data.strength_days_per_week)
              : "",
          cardio_days_per_week:
            data.cardio_days_per_week != null
              ? String(data.cardio_days_per_week)
              : "",
          average_steps:
            data.average_steps != null ? String(data.average_steps) : "",
          time_per_session: data.time_per_session ?? "",
          equipment: data.equipment ?? "",
          main_barriers: data.main_barriers ?? [],
          pain_or_injury_flag: data.pain_or_injury_flag,
          pain_notes: data.pain_notes ?? "",
          nutrition_tags: data.nutrition_tags ?? [],
          guidance_preference: data.guidance_preference ?? [],
          other_notes: data.other_notes ?? "",
        });
      }
      setLoading(false);
    })();
  }, []);

  const setField = <K extends keyof Form>(k: K, v: Form[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleMulti = (
    k: "goal" | "main_barriers" | "nutrition_tags" | "guidance_preference",
    v: string
  ) =>
    setForm((f) => ({
      ...f,
      [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v],
    }));

  const canSubmit = useMemo(() => {
    return (
      form.goal.length > 0 &&
      !!form.training_level &&
      form.strength_days_per_week !== "" &&
      form.cardio_days_per_week !== "" &&
      !!form.time_per_session &&
      !!form.equipment &&
      form.main_barriers.length > 0
    );
  }, [form]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) {
      setSaving(false);
      setError("Your session expired. Please sign in again.");
      navigate({ to: "/login" });
      return;
    }
    const userId = s.session.user.id;

    const update = {
      id: userId,
      email: s.session.user.email ?? null,
      goal: form.goal.join(", "),
      training_level: form.training_level,
      strength_days_per_week: Number(form.strength_days_per_week),
      cardio_days_per_week: Number(form.cardio_days_per_week),
      average_steps: form.average_steps ? Number(form.average_steps) : null,
      time_per_session: form.time_per_session,
      equipment: form.equipment,
      main_barriers: form.main_barriers,
      pain_or_injury_flag: form.pain_or_injury_flag,
      pain_notes:
        form.pain_or_injury_flag === true && form.pain_notes
          ? form.pain_notes
          : null,
      nutrition_tags: form.nutrition_tags,
      guidance_preference: form.guidance_preference,
      other_notes: form.other_notes || null,
      profile_completed_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert(update, { onConflict: "id" });

    setSaving(false);
    if (upsertError) {
      console.error("[onboarding] save failed", upsertError);
      setError(`Profile save failed: ${upsertError.message}`);
      return;
    }
    navigate({ to: "/chat" });
  };

  if (loading) {
    return (
      <main className="mx-auto h-full max-w-2xl overflow-y-auto px-6 pt-20 pb-24">
        <p className="text-sm text-ink-soft">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto h-full max-w-2xl overflow-y-auto px-6 pt-16 pb-24">
      <h1 className="font-serif text-4xl tracking-tight">Set your context</h1>
      <p className="mt-3 text-sm text-ink-soft">
        AskDerivn uses this to give answers that fit your goal, schedule,
        training level, and limitations.
      </p>

      <form onSubmit={onSubmit} className="mt-12 divide-y divide-rule">
        <Question
          label="What are you mainly working toward right now? (Select all that apply)"
          required
        >
          <MultiChips
            options={GOAL_OPTIONS}
            values={form.goal}
            onToggle={(v) => toggleMulti("goal", v)}
          />
        </Question>

        <Question label="What is your current fitness level?" required>
          <Chips
            options={LEVEL_OPTIONS}
            value={form.training_level}
            onChange={(v) => setField("training_level", v)}
          />
        </Question>

        <Question label="What does your current training look like?" required>
          <div className="grid gap-4 sm:grid-cols-3">
            <NumberField
              label="Strength days/week"
              value={form.strength_days_per_week}
              onChange={(v) => setField("strength_days_per_week", v)}
              min={0}
              max={7}
            />
            <NumberField
              label="Cardio days/week"
              value={form.cardio_days_per_week}
              onChange={(v) => setField("cardio_days_per_week", v)}
              min={0}
              max={7}
            />
            <NumberField
              label="Avg daily steps (optional)"
              value={form.average_steps}
              onChange={(v) => setField("average_steps", v)}
              min={0}
              max={100000}
            />
          </div>
        </Question>

        <Question label="How much time do you usually have per session?" required>
          <Chips
            options={TIME_OPTIONS}
            value={form.time_per_session}
            onChange={(v) => setField("time_per_session", v)}
          />
        </Question>

        <Question label="What equipment do you usually have access to?" required>
          <Chips
            options={EQUIPMENT_OPTIONS}
            value={form.equipment}
            onChange={(v) => setField("equipment", v)}
          />
        </Question>

        <Question label="What usually gets in the way?" required>
          <MultiChips
            options={BARRIER_OPTIONS}
            values={form.main_barriers}
            onToggle={(v) => toggleMulti("main_barriers", v)}
          />
        </Question>

        <Question label="Any pain, injury, or movement restriction that affects training?">
          <Chips
            options={["No", "Yes"]}
            value={
              form.pain_or_injury_flag === true
                ? "Yes"
                : form.pain_or_injury_flag === false
                  ? "No"
                  : ""
            }
            onChange={(v) =>
              setField("pain_or_injury_flag", v === "Yes" ? true : false)
            }
          />
          {form.pain_or_injury_flag === true && (
            <div className="mt-4">
              <textarea
                rows={3}
                placeholder="Briefly describe what matters for training."
                value={form.pain_notes}
                onChange={(e) => setField("pain_notes", e.target.value)}
                className="w-full border-b border-rule bg-transparent py-2 text-sm outline-none focus:border-foreground"
              />
            </div>
          )}
          <p className="mt-3 text-xs text-ink-soft">
            AskDerivn cannot diagnose or treat injuries, but this context helps
            it avoid unsafe or unrealistic guidance.
          </p>
        </Question>

        <Question label="How would you describe your nutrition right now?">
          <MultiChips
            options={NUTRITION_OPTIONS}
            values={form.nutrition_tags}
            onToggle={(v) => toggleMulti("nutrition_tags", v)}
          />
        </Question>

        <Question label="What kind of guidance do you want most from AskDerivn?">
          <MultiChips
            options={GUIDANCE_OPTIONS}
            values={form.guidance_preference}
            onToggle={(v) => toggleMulti("guidance_preference", v)}
          />
        </Question>

        <Question label="Anything else AskDerivn should know?">
          <textarea
            rows={4}
            placeholder="Example: work schedule, sleep issues, food preferences, upcoming events, travel, confidence level, or anything that affects consistency."
            value={form.other_notes}
            onChange={(e) => setField("other_notes", e.target.value)}
            className="w-full border-b border-rule bg-transparent py-2 text-sm outline-none focus:border-foreground"
          />
        </Question>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <div className="pt-4">
          <button
            type="submit"
            disabled={saving || !canSubmit}
            className="rounded-sm bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save and continue"}
          </button>
          {!canSubmit && (
            <p className="mt-3 text-xs text-ink-soft">
              Answer the required questions to continue.
            </p>
          )}
        </div>
      </form>
    </main>
  );
}

function Question({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="py-8 first:pt-0">
      <div className="font-serif text-xl tracking-tight text-foreground">
        {label}
        {required && <span className="ml-1 text-ink-soft">*</span>}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Chips({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={
              "rounded-sm border px-3 py-1.5 text-sm transition-colors " +
              (active
                ? "border-foreground bg-foreground text-background"
                : "border-rule text-foreground hover:border-foreground")
            }
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function MultiChips({
  options,
  values,
  onToggle,
}: {
  options: string[];
  values: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = values.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={
              "rounded-sm border px-3 py-1.5 text-sm transition-colors " +
              (active
                ? "border-foreground bg-foreground text-background"
                : "border-rule text-foreground hover:border-foreground")
            }
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min?: number;
  max?: number;
}) {
  return (
    <label className="block">
      <span className="block text-xs text-ink-soft">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border-b border-rule bg-transparent py-2 text-sm outline-none focus:border-foreground"
      />
    </label>
  );
}
