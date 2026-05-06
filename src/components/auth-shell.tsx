import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-rule">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link to="/" className="font-serif text-lg tracking-tight">
            AskDerivn
          </Link>
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
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wider text-ink-soft">
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
