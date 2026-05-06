import {
  createFileRoute,
  Outlet,
  Link,
  useNavigate,
  useLocation,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteFooter } from "@/components/site-footer";

type Profile = {
  subscription_status: string | null;
  subscription_current_period_end: string | null;
  display_name: string | null;
  email: string | null;
};

export const Route = createFileRoute("/_authenticated")({
  component: AuthGuard,
});

function AuthGuard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) {
        navigate({ to: "/login" });
        return;
      }
      const { data: p } = await supabase
        .from("profiles")
        .select(
          "subscription_status, subscription_current_period_end, display_name, email"
        )
        .eq("id", session.user.id)
        .single();
      if (cancelled) return;
      setProfile(p as Profile);
      setLoading(false);

      const isActive =
        p?.subscription_status === "active" &&
        (!p.subscription_current_period_end ||
          new Date(p.subscription_current_period_end) > new Date());

      const path = location.pathname;
      const exempt =
        path === "/subscribe" ||
        path === "/account" ||
        path === "/onboarding";
      if (!isActive && !exempt) {
        navigate({ to: "/subscribe" });
      }
    };
    load();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/login" });
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-sm text-ink-soft">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-rule">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link to="/" className="font-serif text-lg tracking-tight">
            AskDerivn
          </Link>
          <nav className="flex items-center gap-6 text-sm text-ink-soft">
            <Link to="/chat" className="hover:text-foreground" activeProps={{ className: "text-foreground" }}>
              Chat
            </Link>
            <Link to="/resource" className="hover:text-foreground" activeProps={{ className: "text-foreground" }}>
              PDF
            </Link>
            <Link to="/onboarding" className="hover:text-foreground" activeProps={{ className: "text-foreground" }}>
              Profile
            </Link>
            <Link to="/account" className="hover:text-foreground" activeProps={{ className: "text-foreground" }}>
              Account
            </Link>
          </nav>
        </div>
      </header>
      <div className="flex-1">
        <Outlet />
      </div>
      <SiteFooter />
    </div>
  );
}
