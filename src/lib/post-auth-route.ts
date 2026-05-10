// post-auth-route.ts
import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export type PostAuthDestination = "/login" | "/onboarding" | "/chat" | "/admin";

export async function resolvePostAuthDestination(
  userId: string,
  _email?: string | null
): Promise<PostAuthDestination> {
  // Admin check disabled — admin_users table does not exist in this project.

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("profile_completed_at, goal")
    .eq("id", userId)
    .single();

  if (error || !profile) return "/onboarding";

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
  const dest = await resolvePostAuthDestination(
    session.user.id,
    session.user.email
  );

  if (dest === "/onboarding" && pathname !== "/onboarding") {
    throw redirect({ to: "/onboarding" });
  }
  if (dest === "/chat" && pathname === "/onboarding") {
    throw redirect({ to: "/chat" });
  }
  if (dest === "/admin" && pathname !== "/admin") {
    throw redirect({ to: "/admin" });
  }
}
