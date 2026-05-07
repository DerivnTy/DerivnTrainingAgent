import {
  createFileRoute,
  Outlet,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/app-sidebar";
import { ChatProvider } from "@/lib/chat-context";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { authenticatedBeforeLoad } from "@/lib/post-auth-route";
import { DevAccessBadge } from "@/components/dev-access-badge";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ location }) => authenticatedBeforeLoad(location.pathname),
  component: AuthGuard,
});

function AuthGuard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Sign-out listener: if the session disappears mid-session, kick to /login.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/login" });
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  // Close mobile sheet on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  return (
    <ChatProvider>
      <div className="flex h-screen w-full bg-background text-foreground">
        {/* Desktop sidebar */}
        <aside className="hidden h-full w-52 shrink-0 border-r border-rule md:block">
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
                  className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-accent hover:text-foreground active:scale-[0.95]"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <AppSidebar onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
            <span className="font-serif text-base tracking-tight pr-1">
              {location.pathname.startsWith("/chat") ? "AskDerivn" : ""}
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            <Outlet />
          </div>
        </div>
      </div>
      <DevAccessBadge />
    </ChatProvider>
  );
}
