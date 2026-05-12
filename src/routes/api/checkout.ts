import { createFileRoute } from "@tanstack/react-router";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/api/checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
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
          const { data: claimData, error: claimErr } =
            await userClient.auth.getClaims(token);
          if (claimErr || !claimData?.claims?.sub) {
            return new Response("Unauthorized", { status: 401 });
          }
          const userId = claimData.claims.sub as string;
          const email = (claimData.claims.email as string | undefined) ?? undefined;

          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
          const priceId = process.env.STRIPE_PRICE_ID!;

          // Look up profile / customer
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select(
              "stripe_customer_id, email, subscription_status, subscription_current_period_end"
            )
            .eq("id", userId)
            .single();

          // Guard 1: profile already shows an active subscription.
          const periodEnd = profile?.subscription_current_period_end
            ? new Date(profile.subscription_current_period_end)
            : null;
          if (
            profile?.subscription_status === "active" &&
            (!periodEnd || periodEnd.getTime() > Date.now())
          ) {
            return Response.json({ alreadyActive: true });
          }

          let customerId = profile?.stripe_customer_id ?? null;

          // Guard 2: existing Stripe customer may already have an active or
          // trialing subscription that the webhook hasn't synced to profiles
          // yet. Check Stripe directly to prevent a duplicate purchase.
          if (customerId) {
            for (const status of ["active", "trialing"] as const) {
              const list = await stripe.subscriptions.list({
                customer: customerId,
                status,
                limit: 1,
              });
              const existing = list.data[0];
              if (existing) {
                const itemEnd = existing.items.data[0]?.current_period_end;
                await supabaseAdmin
                  .from("profiles")
                  .update({
                    subscription_status: "active",
                    subscription_current_period_end: itemEnd
                      ? new Date(itemEnd * 1000).toISOString()
                      : null,
                    stripe_customer_id: customerId,
                  })
                  .eq("id", userId);
                // Backfill metadata if missing on the existing subscription.
                if (!existing.metadata?.supabase_user_id) {
                  try {
                    await stripe.subscriptions.update(existing.id, {
                      metadata: { supabase_user_id: userId },
                    });
                  } catch (err) {
                    console.warn("Failed to backfill sub metadata", err);
                  }
                }
                return Response.json({ alreadyActive: true });
              }
            }
          }

          if (!customerId) {
            const customer = await stripe.customers.create({
              email: email ?? profile?.email ?? undefined,
              metadata: { supabase_user_id: userId },
            });
            customerId = customer.id;
            await supabaseAdmin
              .from("profiles")
              .update({ stripe_customer_id: customerId })
              .eq("id", userId);
          }

          const origin =
            request.headers.get("origin") ??
            new URL(request.url).origin;

          const idempotencyKey = `checkout:${userId}:${Math.floor(
            Date.now() / 60000
          )}`;
          const session = await stripe.checkout.sessions.create(
            {
              mode: "subscription",
              customer: customerId,
              line_items: [{ price: priceId, quantity: 1 }],
              success_url: `${origin}/post-auth?checkout=success`,
              cancel_url: `${origin}/subscribe`,
              allow_promotion_codes: true,
              client_reference_id: userId,
              metadata: { supabase_user_id: userId },
              subscription_data: {
                metadata: { supabase_user_id: userId },
              },
            },
            { idempotencyKey }
          );


          return Response.json({ url: session.url });
        } catch (e) {
          console.error("checkout error", e);
          return new Response("Internal error", { status: 500 });
        }
      },
    },
  },
});
