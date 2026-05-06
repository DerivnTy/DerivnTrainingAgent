// Server-only request auth helpers.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type AuthedUser = {
  userId: string;
  email: string | undefined;
};

export async function authenticate(request: Request): Promise<AuthedUser | Response> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }
  const token = authHeader.slice(7);
  const userClient = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } }
  );
  const { data, error } = await userClient.auth.getClaims(token);
  if (error || !data?.claims?.sub) {
    return new Response("Unauthorized", { status: 401 });
  }
  return {
    userId: data.claims.sub as string,
    email: data.claims.email as string | undefined,
  };
}

export type SubProfile = {
  subscription_status: string | null;
  subscription_current_period_end: string | null;
};

export async function requireActiveSubscription(
  userId: string
): Promise<SubProfile | Response> {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("subscription_status, subscription_current_period_end")
    .eq("id", userId)
    .single();

  const active =
    profile?.subscription_status === "active" &&
    (!profile.subscription_current_period_end ||
      new Date(profile.subscription_current_period_end) > new Date());

  if (!active) {
    return new Response("Subscription inactive", { status: 402 });
  }
  return profile as SubProfile;
}
