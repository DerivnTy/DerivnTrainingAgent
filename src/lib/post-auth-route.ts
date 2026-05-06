import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { isDevBypassEmail } from "@/lib/dev-bypass";

export type PostAuthDestination =
  | "/login"
  | "/subscribe"
  | "/onboarding"
  | "/chat";

export async function resolvePostAuthDestination(
  userId: string,
  email?: string | null
): Promise<PostAuthDestination> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "subscription_status, subscription_current_period_end, profile_completed_at, goal"
    )
    .eq("id", userId)
    .single();

  if (error || !profile) return "/subscribe";

  // TODO: remove before public launch — preview-only dev bypass
  const bypass = isDevBypassEmail(email);

  const active =
    bypass ||
    (profile.subscription_status === "active" &&
      (!profile.subscription_current_period_end ||
        new Date(profile.subscription_current_period_end) > new Date()));

  if (!active) return "/subscribe";

  const profileComplete =
    Boolean(profile.profile_completed_at) || Boolean(profile.goal);

  return profileComplete ? "/chat" : "/onboarding";
}

export async function waitForSession(maxTries = 10, delayMs = 200) {
  let session = (await supabase.auth.getSession()).data.session;
  for (let i = 0; i < maxTries && !session; i++) {
    await new Promise((r) => setTimeout(r, delayMs));
    session = (await supabase.auth.getSession()).data.session;
  }
  return session;
}

/**
 * Used in `beforeLoad` for the public root route.
 * Logged-out users fall through (render landing). Logged-in users redirect
 * to whatever the resolver returns, before the landing page mounts.
 */
export async function rootBeforeLoad() {
  if (typeof window === "undefined") return;
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) return;
  const dest = await resolvePostAuthDestination(
    session.user.id,
    session.user.email
  );
  throw redirect({ to: dest });
}

/**
 * Used in `beforeLoad` for `/_authenticated`.
 * Centralized funnel: enforces session + subscription + profile state.
 * `pathname` is the requested path so we can allow the one page each
 * intermediate state is allowed to see.
 */
export async function authenticatedBeforeLoad(pathname: string) {
  if (typeof window === "undefined") return;
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) {
    throw redirect({ to: "/login" });
  }
  const dest = await resolvePostAuthDestination(
    session.user.id,
    session.user.email
  );

  // Unsubscribed: only /subscribe is allowed.
  if (dest === "/subscribe" && pathname !== "/subscribe") {
    throw redirect({ to: "/subscribe" });
  }
  // Subscribed but profile incomplete: only /onboarding is allowed.
  if (dest === "/onboarding" && pathname !== "/onboarding") {
    throw redirect({ to: "/onboarding" });
  }
  // dest === "/chat" → fully active, allow whatever route they asked for.
}
