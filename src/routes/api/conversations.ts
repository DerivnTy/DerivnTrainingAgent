import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { authenticate } from "@/server/auth.server";

export const Route = createFileRoute("/api/conversations")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const authed = await authenticate(request);
        if (authed instanceof Response) return authed;
        const { data, error } = await supabaseAdmin
          .from("conversations")
          .select("id, title, updated_at")
          .eq("user_id", authed.userId)
          .order("updated_at", { ascending: false })
          .limit(100);
        if (error) return new Response("Error", { status: 500 });
        return Response.json({ conversations: data ?? [] });
      },
    },
  },
});
