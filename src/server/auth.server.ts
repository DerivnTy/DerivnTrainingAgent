// Server-only request auth helpers.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type AuthedUser = {
  userId: string;
  email: string | undefined;
};

function jsonError(
  status: number,
  error: string,
  debug: string,
  reason?: string
): Response {
  return new Response(
    JSON.stringify({ error, debug, reason }),
    { status, headers: { "Content-Type": "application/json" } }
  );
}

export async function authenticate(request: Request): Promise<AuthedUser | Response> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    console.error("[auth] missing bearer token");
    return jsonError(401, "Please sign in.", "no_bearer_token", "unauthenticated");
  }
  const token = authHeader.slice(7);
  const userClient = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } }
  );
  const { data, error } = await userClient.auth.getClaims(token);
  if (error || !data?.claims?.sub) {
    console.error("[auth] getClaims failed", error?.message);
    return jsonError(401, "Please sign in.", error?.message ?? "invalid_token", "unauthenticated");
  }
  return {
    userId: data.claims.sub as string,
    email: data.claims.email as string | undefined,
  };
}

export type SubProfile = {
  subscription_status: string | null;
  subscription_current_period_end: string | null;
  profile_completed_at: string | null;
  goal: string | null;
};

export async function requireActiveSubscription(
  userId: string
): Promise<SubProfile | Response> {
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("subscription_status, subscription_current_period_end, profile_completed_at, goal")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    console.error("[sub] missing profile", userId, error?.message);
    return jsonError(
      402,
      "Your account is not set up yet.",
      `missing_profile:${error?.message ?? "no_row"}`,
      "missing_profile"
    );
  }

  const status = profile.subscription_status;
  if (!status || status === "inactive") {
    console.error("[sub] inactive", userId, status);
    return jsonError(
      402,
      "You need an active membership to use AskDerivn.",
      `subscription_status=${status}`,
      "missing_subscription"
    );
  }
  if (status !== "active") {
    console.error("[sub] non-active status", userId, status);
    return jsonError(
      402,
      "Your membership is not active.",
      `subscription_status=${status}`,
      "inactive_subscription"
    );
  }
  if (
    profile.subscription_current_period_end &&
    new Date(profile.subscription_current_period_end) <= new Date()
  ) {
    console.error("[sub] expired", userId, profile.subscription_current_period_end);
    return jsonError(
      402,
      "Your membership has expired.",
      `period_end=${profile.subscription_current_period_end}`,
      "subscription_expired"
    );
  }

  return profile as SubProfile;
}

export function requireCompleteProfile(profile: SubProfile): Response | null {
  const complete = Boolean(profile.profile_completed_at) || Boolean(profile.goal);
  if (!complete) {
    return new Response(
      JSON.stringify({
        error: "Please finish onboarding before chatting.",
        debug: "profile_incomplete",
        reason: "profile_incomplete",
      }),
      { status: 428, headers: { "Content-Type": "application/json" } }
    );
  }
  return null;
}
