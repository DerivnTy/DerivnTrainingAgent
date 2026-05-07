import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { AuthShell, Field, Divider } from "./login";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({
    meta: [{ title: "Get access — AskDerivn" }],
  }),
});

function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/post-auth",
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    // If session is established immediately (auto-confirm), go to pay portal.
    if (data.session) {
      navigate({ to: "/onboarding" });
      return;
    }
    setSent(true);
  };

  const onGoogle = async () => {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/post-auth",
    });
    if (result.error) {
      setError(result.error.message ?? "Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/post-auth" });
  };

  if (sent) {
    return (
      <AuthShell
        title="Check your email"
        subtitle="Confirm your email to continue to payment."
      >
        <p className="text-sm text-ink-soft">
          Already confirmed?{" "}
          <Link to="/login" className="text-foreground text-link underline">
            Sign in
          </Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Get access"
      subtitle="Create your AskDerivn account. Membership is $50/month."
      rightLink={{ to: "/login", label: "Sign in" }}
    >
      <button onClick={onGoogle} className="btn-secondary w-full">
        Sign up with Google
      </button>
      {!showEmailForm ? (
        <button
          onClick={() => setShowEmailForm(true)}
          className="btn-primary mt-3 w-full"
        >
          Create an account
        </button>
      ) : (
        <>
          <Divider />
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Email">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-b border-rule bg-transparent py-2 text-sm input-soft"
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-b border-rule bg-transparent py-2 text-sm input-soft"
              />
            </Field>
            <Field label="Confirm password">
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border-b border-rule bg-transparent py-2 text-sm input-soft"
              />
            </Field>
            {error && <p className="text-sm text-red-700">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Creating…" : "Next"}
            </button>
          </form>
        </>
      )}
      <p className="mt-8 text-center text-sm text-ink-soft">
        Already have an account?{" "}
        <Link to="/login" className="text-foreground text-link underline">
          Sign in
        </Link>
      </p>
      <section className="mt-12 border-t border-rule pt-8 text-center">
        <h2 className="font-serif text-2xl tracking-tight">
          What you get with AskDerivn
        </h2>
        <ul className="mt-5 space-y-2 text-sm text-ink-soft">
          <li className="flex gap-3">
            <span aria-hidden className="mt-2 h-px w-4 shrink-0 bg-rule" />
            <span>Private, judgment-free chat tuned to your goals.</span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden className="mt-2 h-px w-4 shrink-0 bg-rule" />
            <span>Honest and direct guidance.</span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden className="mt-2 h-px w-4 shrink-0 bg-rule" />
            <span>Unlimited conversations for $50/month.</span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden className="mt-2 h-px w-4 shrink-0 bg-rule" />
            <span>Cancel anytime, right from your account.</span>
          </li>
        </ul>
      </section>
    </AuthShell>
  );
}
