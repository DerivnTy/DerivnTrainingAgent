import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { authedFetch } from "@/lib/auth-helpers";

export const Route = createFileRoute("/_authenticated/account")({
  component: AccountPage,
  head: () => ({ meta: [{ title: "Account — AskDerivn" }] }),
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
  nutrition_context: string;
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
  nutrition_context: "",
  guidance_preference: [],
  other_notes: "",
};

function AccountPage() {
  const [email, setEmail] = useState<string | null>(null);
  // (sign-in provider tracking removed — email/password is the only method)
  const [subStatus, setSubStatus] = useState<string | null>(null);
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);

  const [newEmail, setNewEmail] = useState("");
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [emailErr, setEmailErr] = useState<string | null>(null);

  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [resetErr, setResetErr] = useState<string | null>(null);

  const [portalLoading, setPortalLoading] = useState(false);
  const [portalErr, setPortalErr] = useState<string | null>(null);

  const [form, setForm] = useState<Form>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) return;
      const user = s.session.user;
      setEmail(user.email ?? null);
      // provider no longer used

      const { data } = await supabase
        .from("profiles")
        .select(
          "subscription_status, subscription_current_period_end, goal, training_level, strength_days_per_week, cardio_days_per_week, average_steps, time_per_session, equipment, main_barriers, pain_or_injury_flag, pain_notes, nutrition_tags, nutrition_context, guidance_preference, other_notes"
        )
        .eq("id", user.id)
        .single();

      if (data) {
        setSubStatus(data.subscription_status ?? null);
        setPeriodEnd(data.subscription_current_period_end ?? null);
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
          nutrition_context: data.nutrition_context ?? "",
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

  const onChangeEmail = async (e: FormEvent) => {
    e.preventDefault();
    setEmailMsg(null);
    setEmailErr(null);
    if (!newEmail) return;
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) setEmailErr(error.message);
    else
      setEmailMsg(
        "Confirmation sent. Check both your old and new inboxes to confirm the change."
      );
  };

  const onResetPassword = async () => {
    setResetMsg(null);
    setResetErr(null);
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) setResetErr(error.message);
    else setResetMsg("Password reset email sent.");
  };

  const openPortal = async () => {
    setPortalLoading(true);
    setPortalErr(null);
    try {
      const res = await authedFetch("/api/portal", { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      const { url } = await res.json();
      window.location.href = url;
    } catch (e) {
      setPortalErr(e instanceof Error ? e.message : "Could not open portal");
      setPortalLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const canSave = useMemo(() => {
    return (
      form.goal.length > 0 &&
      !!form.training_level &&
      form.strength_days_per_week !== "" &&
      form.cardio_days_per_week !== "" &&
      !!form.time_per_session &&
      !!form.equipment
    );
  }, [form]);

  const onSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSavedMsg(null);
    setSaveErr(null);
    setSaving(true);
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) {
      setSaving(false);
      setSaveErr("Your session expired. Please sign in again.");
      return;
    }
    const userId = s.session.user.id;
    const update = {
      id: userId,
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
      nutrition_context: form.nutrition_context || null,
      guidance_preference: form.guidance_preference,
      other_notes: form.other_notes || null,
    };
    const { error } = await supabase
      .from("profiles")
      .update(update)
      .eq("id", userId);
    setSaving(false);
    if (error) {
      setSaveErr(error.message);
      return;
    }
    setSavedMsg("Profile updated.");
  };

  if (loading) {
    return (
      <main className="mx-auto h-full max-w-2xl overflow-y-auto px-6 pt-20 pb-24">
        <p className="t-body-sm">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto h-full max-w-2xl overflow-y-auto px-6 pt-4 pb-24">
      <div className="flex items-center justify-between gap-4">
        <h1 className="t-h1">Account</h1>
        <Link
          to="/chat"
          className="t-eyebrow text-link hover:text-foreground"
        >
          ← Back to chat
        </Link>
      </div>
      <p className="mt-3 t-body-sm">
        Manage your sign-in and the context AskDerivn uses to give better
        answers.
      </p>

      {/* ACCOUNT INFO */}
      <Section title="Account info">
        <dl className="space-y-4 t-body-sm">
          <Row label="Email" value={email ?? "—"} />
          <Row label="Membership" value={subStatus ?? "inactive"} />
          {periodEnd && (
            <Row
              label={subStatus === "active" ? "Renews on" : "Ends on"}
              value={new Date(periodEnd).toLocaleDateString()}
            />
          )}
        </dl>

        <form onSubmit={onChangeEmail} className="mt-8 space-y-3">
          <label className="block t-eyebrow">
            Change email
          </label>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="new@email.com"
            className="w-full border-b border-rule bg-transparent py-2 t-body-sm input-soft"
          />
          <button type="submit" className="btn-secondary">
            Send confirmation
          </button>
          {emailMsg && <p className="t-meta">{emailMsg}</p>}
          {emailErr && <p className="t-error">{emailErr}</p>}
        </form>

        <div className="mt-8 space-y-2">
          <button type="button" onClick={onResetPassword} className="btn-secondary">
            Send password reset email
          </button>
          {resetMsg && <p className="t-meta">{resetMsg}</p>}
          {resetErr && <p className="t-error">{resetErr}</p>}
        </div>

        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={openPortal}
            disabled={portalLoading}
            className="btn-secondary w-full"
          >
            {portalLoading ? "Opening…" : "Manage billing"}
          </button>
          {portalErr && <p className="t-error">{portalErr}</p>}
          <button type="button" onClick={signOut} className="btn-secondary w-full">
            Sign out
          </button>
        </div>
      </Section>

      {/* PROFILE CONTEXT */}
      <form onSubmit={onSaveProfile}>
        <Section title="Training context">
          <Question label="Primary goal" required>
            <MultiChips
              options={GOAL_OPTIONS}
              values={form.goal}
              onToggle={(v) => toggleMulti("goal", v)}
            />
          </Question>

          <Question label="Training level" required>
            <Chips
              options={LEVEL_OPTIONS}
              value={form.training_level}
              onChange={(v) => setField("training_level", v)}
            />
          </Question>

          <Question label="Weekly training" required>
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

          <Question label="Time per session" required>
            <Chips
              options={TIME_OPTIONS}
              value={form.time_per_session}
              onChange={(v) => setField("time_per_session", v)}
            />
          </Question>

          <Question label="Equipment" required>
            <Chips
              options={EQUIPMENT_OPTIONS}
              value={form.equipment}
              onChange={(v) => setField("equipment", v)}
            />
          </Question>
        </Section>

        <Section title="Nutrition + barriers">
          <Question label="Current nutrition structure">
            <MultiChips
              options={NUTRITION_OPTIONS}
              values={form.nutrition_tags}
              onToggle={(v) => toggleMulti("nutrition_tags", v)}
            />
          </Question>

          <Question label="Nutrition notes">
            <textarea
              rows={3}
              placeholder="Food preferences, schedule, meal timing, biggest struggle, anything relevant."
              value={form.nutrition_context}
              onChange={(e) => setField("nutrition_context", e.target.value)}
              className="w-full border-b border-rule bg-transparent py-2 t-body-sm input-soft"
            />
          </Question>

          <Question label="Main barriers">
            <MultiChips
              options={BARRIER_OPTIONS}
              values={form.main_barriers}
              onToggle={(v) => toggleMulti("main_barriers", v)}
            />
          </Question>

          <Question label="Guidance preference">
            <MultiChips
              options={GUIDANCE_OPTIONS}
              values={form.guidance_preference}
              onToggle={(v) => toggleMulti("guidance_preference", v)}
            />
          </Question>
        </Section>

        <Section title="Limitations + notes">
          <Question label="Pain, injury, or movement limitation">
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
                  className="w-full border-b border-rule bg-transparent py-2 t-body-sm input-soft"
                />
              </div>
            )}
            <p className="mt-3 t-meta">
              AskDerivn cannot diagnose or treat injuries. This context helps
              it avoid unrealistic or unsafe guidance.
            </p>
          </Question>

          <Question label="Anything else AskDerivn should know?">
            <textarea
              rows={4}
              placeholder="Work schedule, sleep issues, food preferences, travel, upcoming events, confidence level, or anything that affects consistency."
              value={form.other_notes}
              onChange={(e) => setField("other_notes", e.target.value)}
              className="w-full border-b border-rule bg-transparent py-2 t-body-sm input-soft"
            />
          </Question>
        </Section>

        <div className="pt-6">
          {saveErr && <p className="mb-3 t-error">{saveErr}</p>}
          {savedMsg && (
            <p className="mb-3 t-body-sm">{savedMsg}</p>
          )}
          <button
            type="submit"
            disabled={saving || !canSave}
            className="btn-secondary btn-pill-lg"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          {!canSave && (
            <p className="mt-3 t-meta">
              Fill in the required training fields to save.
            </p>
          )}
        </div>
      </form>

      <p className="mt-12 t-meta">
        Need to start from scratch?{" "}
        <Link to="/onboarding" className="underline">
          Redo onboarding
        </Link>
      </p>

      <div className="mt-10 flex justify-end">
        <Link
          to="/chat"
          className="t-eyebrow text-link hover:text-foreground"
        >
          ← Back to chat
        </Link>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12 border-t border-rule pt-10">
      <h2 className="t-h2">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-rule pb-3">
      <dt className="t-eyebrow">
        {label}
      </dt>
      <dd className="t-body-sm">{value}</dd>
    </div>
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
    <div className="py-6 first:pt-0">
      <div className="t-eyebrow">
        {label}
        {required && <span className="ml-1">*</span>}
      </div>
      <div className="mt-3">{children}</div>
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
              "rounded-full border px-4 py-1.5 text-sm transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] " +
              (active
                ? "border-foreground bg-foreground text-background"
                : "border-rule text-foreground hover:bg-accent")
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
              "rounded-full border px-4 py-1.5 text-sm transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] " +
              (active
                ? "border-foreground bg-foreground text-background"
                : "border-rule text-foreground hover:bg-accent")
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
      <span className="block t-meta">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border-b border-rule bg-transparent py-2 t-body-sm input-soft"
      />
    </label>
  );
}

