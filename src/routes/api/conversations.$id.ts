import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { authenticate } from "@/server/auth.server";

export const Route = createFileRoute("/api/conversations/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const authed = await authenticate(request);
        if (authed instanceof Response) return authed;
        const { data: conv } = await supabaseAdmin
          .from("conversations")
          .select("id, user_id, title")
          .eq("id", params.id)
          .single();
        if (!conv || conv.user_id !== authed.userId)
          return new Response("Not found", { status: 404 });
        const { data: messages } = await supabaseAdmin
          .from("messages")
          .select("id, role, content, created_at")
          .eq("conversation_id", params.id)
          .order("created_at", { ascending: true });
        return Response.json({
          conversation: { id: conv.id, title: conv.title },
          messages: messages ?? [],
        });
      },
      PATCH: async ({ request, params }) => {
        const authed = await authenticate(request);
        if (authed instanceof Response) return authed;
        const body = (await request.json()) as { title?: string };
        const title = (body.title ?? "").trim().slice(0, 120);
        if (!title) return new Response("Bad request", { status: 400 });
        const { error } = await supabaseAdmin
          .from("conversations")
          .update({ title })
          .eq("id", params.id)
          .eq("user_id", authed.userId);
        if (error) return new Response("Error", { status: 500 });
        return Response.json({ ok: true });
      },
      DELETE: async ({ request, params }) => {
        const authed = await authenticate(request);
        if (authed instanceof Response) return authed;
        const { error } = await supabaseAdmin
          .from("conversations")
          .delete()
          .eq("id", params.id)
          .eq("user_id", authed.userId);
        if (error) return new Response("Error", { status: 500 });
        return Response.json({ ok: true });
      },
    },
  },
});
