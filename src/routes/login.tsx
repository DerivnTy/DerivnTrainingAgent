import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [{ title: "Sign in — AskDerivn" }],
  }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate({ to: "/post-auth" });
  };

  const onOAuth = async (provider: "google" | "apple") => {
    if (oauthLoading) return;
    setError(null);
    setOauthLoading(provider);
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

  return (
    <AuthShell title="Welcome back" subtitle="Pick up right where you left off." rightLink={{ to: "/signup", label: "Get access" }}>
      <button
        onClick={() => onOAuth("google")}
        disabled={!!oauthLoading}
        className="btn-secondary w-full"
      >
        {oauthLoading === "google" ? "Redirecting…" : "Continue with Google"}
      </button>
      <button
        onClick={() => onOAuth("apple")}
        disabled={!!oauthLoading}
        className="btn-secondary mt-3 w-full"
      >
        {oauthLoading === "apple" ? "Redirecting…" : "Continue with Apple"}
      </button>
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border-b border-rule bg-transparent py-2 text-sm input-soft"
          />
        </Field>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-center text-sm text-ink-soft">
          <Link to="/forgot-password" className="text-link hover:text-foreground">
            Forgot password?
          </Link>
        </p>
      </form>
      <p className="mt-8 text-center text-sm text-ink-soft">
        New here?{" "}
        <Link to="/signup" className="text-foreground text-link underline">
          Get access
        </Link>
      </p>
      <section className="mt-12 border-t border-rule pt-8 text-center">
        <h2 className="font-serif text-2xl tracking-tight">No starting over</h2>
        <p className="mt-3 text-sm text-ink-soft">
          Your chats, goals, and training context stay connected so every
          answer builds from what AskDerivn already knows.
        </p>
      </section>
    </AuthShell>
  );
}

export function AuthShell({
  title,
  subtitle,
  rightLink,
  children,
}: {
  title: string;
  subtitle?: string;
  rightLink?: { to: "/login" | "/signup"; label: string };
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-rule">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link to="/" className="font-serif text-lg tracking-tight">
            AskDerivn
          </Link>
          {rightLink && (
            <Link to={rightLink.to} className="text-sm text-ink-soft text-link hover:text-foreground">
              {rightLink.label}
            </Link>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-md flex-1 px-6 pt-20 pb-24">
        <h1 className="font-serif text-4xl tracking-tight">{title}</h1>
        {subtitle && (
          <p className="mt-3 text-sm text-ink-soft">{subtitle}</p>
        )}
        <div className="mt-10 space-y-6">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block font-mono text-xs uppercase tracking-wider text-ink-soft">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function Divider() {
  return (
    <div className="flex items-center gap-3 text-xs text-ink-soft">
      <div className="h-px flex-1 bg-rule" />
      <span>or</span>
      <div className="h-px flex-1 bg-rule" />
    </div>
  );
}
