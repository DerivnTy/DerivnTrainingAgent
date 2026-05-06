import { createFileRoute } from "@tanstack/react-router";
import Stripe from "stripe";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const sig = request.headers.get("stripe-signature");
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (!sig || !secret || !stripeKey) {
          return new Response("Missing config", { status: 400 });
        }
        const stripe = new Stripe(stripeKey);
        const body = await request.text();

        let event: Stripe.Event;
        try {
          event = await stripe.webhooks.constructEventAsync(body, sig, secret);
        } catch (err) {
          console.error("Webhook signature verification failed", err);
          return new Response("Invalid signature", { status: 400 });
        }

        try {
          async function applySubscription(sub: Stripe.Subscription) {
            const userId =
              (sub.metadata?.supabase_user_id as string | undefined) ??
              null;
            const customerId =
              typeof sub.customer === "string" ? sub.customer : sub.customer.id;

            const status = sub.status; // active, trialing, canceled, past_due, etc.
            const periodEnd = sub.items.data[0]?.current_period_end
              ? new Date(sub.items.data[0].current_period_end * 1000).toISOString()
              : null;

            const update = {
              subscription_status:
                status === "trialing" ? "active" : status,
              subscription_current_period_end: periodEnd,
              stripe_customer_id: customerId,
            };

            if (userId) {
              await supabaseAdmin
                .from("profiles")
                .update(update)
                .eq("id", userId);
            } else {
              await supabaseAdmin
                .from("profiles")
                .update(update)
                .eq("stripe_customer_id", customerId);
            }
          }

          switch (event.type) {
            case "checkout.session.completed": {
              const session = event.data.object as Stripe.Checkout.Session;
              if (session.subscription) {
                const subId =
                  typeof session.subscription === "string"
                    ? session.subscription
                    : session.subscription.id;
                const sub = await stripe.subscriptions.retrieve(subId);
                // Backfill metadata if missing
                const userId =
                  (session.metadata?.supabase_user_id as string | undefined) ??
                  (session.client_reference_id as string | undefined);
                if (userId && !sub.metadata?.supabase_user_id) {
                  await stripe.subscriptions.update(subId, {
                    metadata: { supabase_user_id: userId },
                  });
                  sub.metadata = { ...sub.metadata, supabase_user_id: userId };
                }
                await applySubscription(sub);
              }
              break;
            }
            case "customer.subscription.created":
            case "customer.subscription.updated":
            case "customer.subscription.deleted": {
              const sub = event.data.object as Stripe.Subscription;
              await applySubscription(sub);
              break;
            }
            default:
              break;
          }

          return new Response("ok", { status: 200 });
        } catch (e) {
          console.error("Webhook handler error", e);
          return new Response("Handler error", { status: 500 });
        }
      },
    },
  },
});
