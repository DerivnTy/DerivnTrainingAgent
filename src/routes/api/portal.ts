import { createFileRoute } from "@tanstack/react-router";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/api/portal")({
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

          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("stripe_customer_id")
            .eq("id", userId)
            .single();

          if (!profile?.stripe_customer_id) {
            return new Response("No Stripe customer", { status: 400 });
          }

          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
          const origin =
            request.headers.get("origin") ??
            new URL(request.url).origin;

          const session = await stripe.billingPortal.sessions.create({
            customer: profile.stripe_customer_id,
            return_url: `${origin}/account`,
          });

          return Response.json({ url: session.url });
        } catch (e) {
          console.error("portal error", e);
          return new Response("Internal error", { status: 500 });
        }
      },
    },
  },
});
