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
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);
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
    // Always route through /post-auth so the subscription gate applies.
    if (data.session) {
      navigate({ to: "/post-auth" });
      return;
    }
    setSent(true);
  };

  const onOAuth = async (provider: "google" | "apple") => {
    if (oauthLoading) return;
    setError(null);
    setOauthLoading(provider);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("oauth_intent", "signup");
    }
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin + "/post-auth",
    });
    if (result.error) {
      setOauthLoading(null);
      setError(result.error.message ?? `${provider === "google" ? "Google" : "Apple"} sign-in failed`);
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
        <p className="t-body-sm">
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
      subtitle="Create your AskDerivn account. Membership is $30/month. Cancel anytime."
      rightLink={{ to: "/login", label: "Sign in" }}
    >
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => onOAuth("google")}
          disabled={!!oauthLoading}
          className="btn-secondary w-full"
        >
          {oauthLoading === "google" ? "Redirecting…" : "Continue with Google"}
        </button>
        <button
          type="button"
          onClick={() => onOAuth("apple")}
          disabled={!!oauthLoading}
          className="btn-secondary w-full"
        >
          {oauthLoading === "apple" ? "Redirecting…" : "Continue with Apple"}
        </button>
      </div>
      {!showEmailForm ? (
        <button
          type="button"
          onClick={() => setShowEmailForm(true)}
          className="btn-primary mt-3 w-full"
        >
          Create an account
        </button>
      ) : (
        <>
          <div className="mt-6">
            <Divider />
          </div>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
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
      <p className="mt-8 text-center t-body-sm">
        Already have an account?{" "}
        <Link to="/login" className="text-foreground text-link underline">
          Sign in
        </Link>
      </p>
      <section className="mt-12 border-t border-rule pt-8">
        <h3 className="t-h3">
          What you get with AskDerivn
        </h3>
        <ul className="mt-5 space-y-2 pl-5 t-body-sm list-disc marker:text-ink-soft/60">
          <li>Private chat built around your goals.</li>
          <li>Direct answers for training, nutrition, running, and recovery.</li>
          <li>Saved conversations and remembered context.</li>
          <li>Built for Motion PDF included.</li>
          <li>$30/month. Cancel anytime.</li>
        </ul>
      </section>
    </AuthShell>
  );
}
