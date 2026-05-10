import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, Field } from "./login";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
  head: () => ({
    meta: [{ title: "Forgot password — AskDerivn" }],
  }),
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <AuthShell
        title="Check your email"
        subtitle="If an account exists for that email, we've sent a password reset link."
        rightLink={{ to: "/login", label: "Sign in" }}
      >
        <p className="text-sm text-ink-soft">
          Didn't get it? Check your spam folder, or{" "}
          <button
            onClick={() => setSent(false)}
            className="text-foreground text-link underline"
          >
            try again
          </button>
          .
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter the email tied to your account and we'll send you a reset link."
      rightLink={{ to: "/login", label: "Sign in" }}
    >
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
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <p className="mt-8 text-center text-sm text-ink-soft">
        Remembered it?{" "}
        <Link to="/login" className="text-foreground text-link underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
