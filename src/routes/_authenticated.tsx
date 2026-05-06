import {
  createFileRoute,
  Outlet,
  useNavigate,
  useLocation,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/app-sidebar";
import { ChatProvider } from "@/lib/chat-context";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

type Profile = {
  subscription_status: string | null;
  subscription_current_period_end: string | null;
};

export const Route = createFileRoute("/_authenticated")({
  component: AuthGuard,
});

function AuthGuard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

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
        .select("subscription_status, subscription_current_period_end")
        .eq("id", session.user.id)
        .single();
      if (cancelled) return;
      setLoading(false);

      const profile = p as Profile | null;
      const isActive =
        profile?.subscription_status === "active" &&
        (!profile.subscription_current_period_end ||
          new Date(profile.subscription_current_period_end) > new Date());

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

  // Close mobile sheet on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-sm text-ink-soft">Loading…</p>
      </div>
    );
  }

  return (
    <ChatProvider>
      <div className="flex h-screen w-full bg-background text-foreground">
        {/* Desktop sidebar */}
        <aside className="hidden h-full w-64 shrink-0 border-r border-rule md:block">
          <AppSidebar />
        </aside>

        {/* Main column */}
        <div className="flex h-full min-w-0 flex-1 flex-col">
          {/* Mobile top strip */}
          <div className="flex items-center justify-between border-b border-rule px-4 py-3 md:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  aria-label="Open menu"
                  className="text-ink-soft hover:text-foreground"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <AppSidebar onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
            <span className="font-serif text-base tracking-tight">
              AskDerivn
            </span>
            <span className="w-5" />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <Outlet />
          </div>
        </div>
      </div>
    </ChatProvider>
  );
}
