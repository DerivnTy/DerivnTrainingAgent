import { createFileRoute } from "@tanstack/react-router";
import OpenAI from "openai";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { authenticate, requireActiveSubscription } from "@/server/auth.server";
import {
  MONTHLY_TOKEN_CAP,
  addUsage,
  getCurrentPeriod,
  getUsedTokens,
} from "@/server/usage.server";
import { DERIVNOS_PROMPT, buildProfileBlock } from "@/server/derivnos";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const authed = await authenticate(request);
          if (authed instanceof Response) return authed;
          const { userId } = authed;

          const sub = await requireActiveSubscription(userId);
          if (sub instanceof Response) return sub;

          const period = getCurrentPeriod(sub.subscription_current_period_end);
          const used = await getUsedTokens(userId, period);
          if (used >= MONTHLY_TOKEN_CAP) {
            return new Response(
              JSON.stringify({
                error:
                  "You've reached the current usage limit for this billing period. Access will reset at the start of your next cycle.",
              }),
              { status: 429, headers: { "Content-Type": "application/json" } }
            );
          }

          const body = (await request.json()) as {
            conversation_id?: string | null;
            content?: string;
          };
          const content = (body.content ?? "").trim();
          if (!content) return new Response("Empty message", { status: 400 });
          if (content.length > 8000)
            return new Response("Message too long", { status: 400 });

          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
          const assistantId = process.env.OPENAI_ASSISTANT_ID!;

          // Resolve / create conversation
          let conversationId = body.conversation_id ?? null;
          let threadId: string | null = null;

          if (conversationId) {
            const { data: conv } = await supabaseAdmin
              .from("conversations")
              .select("id, user_id, openai_thread_id")
              .eq("id", conversationId)
              .single();
            if (!conv || conv.user_id !== userId) {
              return new Response("Conversation not found", { status: 404 });
            }
            threadId = conv.openai_thread_id;
          } else {
            const title = content.slice(0, 60);
            const { data: created, error: createErr } = await supabaseAdmin
              .from("conversations")
              .insert({ user_id: userId, title })
              .select("id")
              .single();
            if (createErr || !created)
              return new Response("Could not create conversation", { status: 500 });
            conversationId = created.id;
          }

          if (!threadId) {
            const thread = await openai.beta.threads.create();
            threadId = thread.id;
            await supabaseAdmin
              .from("conversations")
              .update({ openai_thread_id: threadId })
              .eq("id", conversationId);
          }

          // Save user message
          await supabaseAdmin.from("messages").insert({
            conversation_id: conversationId,
            role: "user",
            content,
          });

          // Load profile for per-request context
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select(
              "display_name, goal, training_level, weekly_schedule, strength_days_per_week, cardio_days_per_week, time_per_session, equipment, limitations, pain_notes, nutrition_context, other_notes"
            )
            .eq("id", userId)
            .single();

          const additionalInstructions =
            DERIVNOS_PROMPT + "\n\n" + buildProfileBlock(profile);

          // Append user message to OpenAI thread
          await openai.beta.threads.messages.create(threadId, {
            role: "user",
            content,
          });

          // Run + poll
          const run = await openai.beta.threads.runs.createAndPoll(threadId, {
            assistant_id: assistantId,
            additional_instructions: additionalInstructions,
          });

          if (run.status !== "completed") {
            return new Response(
              JSON.stringify({
                error: `Assistant run ${run.status}.`,
              }),
              { status: 502, headers: { "Content-Type": "application/json" } }
            );
          }

          // Track usage
          if (run.usage) {
            await addUsage(
              userId,
              period,
              run.usage.prompt_tokens ?? 0,
              run.usage.completion_tokens ?? 0
            );
          }

          // Read latest assistant message
          const list = await openai.beta.threads.messages.list(threadId, {
            order: "desc",
            limit: 5,
          });
          const assistantMsg = list.data.find((m) => m.role === "assistant");
          let assistantText = "";
          if (assistantMsg) {
            for (const part of assistantMsg.content) {
              if (part.type === "text") assistantText += part.text.value;
            }
          }
          if (!assistantText) assistantText = "(No response.)";

          const { data: saved } = await supabaseAdmin
            .from("messages")
            .insert({
              conversation_id: conversationId,
              role: "assistant",
              content: assistantText,
            })
            .select("id, content, created_at")
            .single();

          // Touch conversation updated_at
          await supabaseAdmin
            .from("conversations")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", conversationId);

          return Response.json({
            conversation_id: conversationId,
            message: saved,
          });
        } catch (e) {
          console.error("chat error", e);
          return new Response(
            JSON.stringify({ error: "Something went wrong." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
