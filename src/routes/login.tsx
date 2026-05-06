import { createFileRoute, redirect } from "@tanstack/react-router";

// Login is unified with /signup ("Get access"). Anyone hitting /login
// is sent to the same page so there is no flip-flop between two screens.
export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    throw redirect({ to: "/signup" });
  },
});

// Re-export shared shell pieces so existing imports keep working.
export { AuthShell, Field, Divider } from "@/components/auth-shell";
