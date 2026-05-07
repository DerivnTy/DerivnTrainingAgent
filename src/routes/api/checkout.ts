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
            .select("stripe_customer_id, email")
            .eq("id", userId)
            .single();

          let customerId = profile?.stripe_customer_id ?? null;
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

          const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            customer: customerId,
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${origin}/post-auth`,
            cancel_url: `${origin}/`,
            allow_promotion_codes: true,
            client_reference_id: userId,
            metadata: { supabase_user_id: userId },
            subscription_data: {
              metadata: { supabase_user_id: userId },
            },
          });

          return Response.json({ url: session.url });
        } catch (e) {
          console.error("checkout error", e);
          return new Response("Internal error", { status: 500 });
        }
      },
    },
  },
});
