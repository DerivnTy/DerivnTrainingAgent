import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin.rpc("is_admin", {
    _user_id: userId,
  });
  if (error) {
    console.error("[admin] is_admin rpc failed", error);
    throw new Response("Forbidden", { status: 403 });
  }
  if (!data) throw new Response("Forbidden", { status: 403 });
}

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin.rpc("is_admin", {
      _user_id: context.userId,
    });
    if (error) return { isAdmin: false };
    return { isAdmin: Boolean(data) };
  });

export const getAdminSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);

    const nowIso = new Date().toISOString();

    const [totalRes, activeRes, canceledRes, membershipsRes, recentRes] =
      await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select("id", { count: "exact", head: true }),
        supabaseAdmin
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("subscription_status", "active")
          .or(
            `subscription_current_period_end.is.null,subscription_current_period_end.gt.${nowIso}`
          ),
        supabaseAdmin
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .neq("subscription_status", "active"),
        supabaseAdmin
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .not("stripe_customer_id", "is", null),
        supabaseAdmin
          .from("profiles")
          .select("id, email, display_name, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

    return {
      totalSignups: totalRes.count ?? 0,
      activeSubscribers: activeRes.count ?? 0,
      canceledOrInactive: canceledRes.count ?? 0,
      totalMemberships: membershipsRes.count ?? 0,
      recent: recentRes.data ?? [],
    };
  });

export const getAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, email, display_name, subscription_status, subscription_current_period_end, stripe_customer_id, profile_completed_at, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("[admin] getAdminUsers failed", error);
      throw new Response("Failed to load users", { status: 500 });
    }

    return { users: data ?? [] };
  });
