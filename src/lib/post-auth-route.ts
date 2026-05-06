import { supabase } from "@/integrations/supabase/client";

export type PostAuthDestination =
  | "/login"
  | "/subscribe"
  | "/onboarding"
  | "/chat";

export async function resolvePostAuthDestination(
  userId: string
): Promise<PostAuthDestination> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "subscription_status, subscription_current_period_end, profile_completed_at, goal"
    )
    .eq("id", userId)
    .single();

  if (error || !profile) return "/subscribe";

  const active =
    profile.subscription_status === "active" &&
    (!profile.subscription_current_period_end ||
      new Date(profile.subscription_current_period_end) > new Date());

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
