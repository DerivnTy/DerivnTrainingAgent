// post-auth-route.ts
import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export type PostAuthDestination =
  | "/login"
  | "/subscribe"
  | "/onboarding"
  | "/chat"
  | "/admin";

async function isCurrentUserAdmin(userId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    return Boolean(data);
  } catch {
    return false;
  }
}

export async function resolvePostAuthDestination(
  userId: string,
  _email?: string | null
): Promise<PostAuthDestination> {
  if (await isCurrentUserAdmin()) return "/admin";

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "profile_completed_at, goal, subscription_status, subscription_current_period_end"
    )
    .eq("id", userId)
    .single();

  if (error || !profile) return "/subscribe";

  const periodEnd = profile.subscription_current_period_end
    ? new Date(profile.subscription_current_period_end)
    : null;
  const subActive =
    profile.subscription_status === "active" &&
    (!periodEnd || periodEnd.getTime() > Date.now());

  if (!subActive) return "/subscribe";

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

export async function authenticatedBeforeLoad(pathname: string) {
  if (typeof window === "undefined") return;
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) {
    throw redirect({ to: "/login" });
  }

  // /account is always allowed for signed-in users (billing management).
  if (pathname.startsWith("/account")) return;

  // /admin: only admins; everyone else gets bounced to their normal destination.
  if (pathname.startsWith("/admin")) {
    if (await isCurrentUserAdmin()) return;
    const dest = await resolvePostAuthDestination(
      session.user.id,
      session.user.email
    );
    throw redirect({ to: dest === "/admin" ? "/chat" : dest });
  }

  const dest = await resolvePostAuthDestination(
    session.user.id,
    session.user.email
  );

  if (dest === "/admin") {
    throw redirect({ to: "/admin" });
  }
  if (dest === "/subscribe") {
    throw redirect({ to: "/subscribe" });
  }
  if (dest === "/onboarding" && pathname !== "/onboarding") {
    throw redirect({ to: "/onboarding" });
  }
  if (dest === "/chat" && pathname === "/onboarding") {
    throw redirect({ to: "/chat" });
  }
}

export async function subscribeBeforeLoad() {
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
  if (dest !== "/subscribe") {
    throw redirect({ to: dest });
  }
}
