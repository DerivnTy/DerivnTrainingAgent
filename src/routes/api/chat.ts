import { createFileRoute } from "@tanstack/react-router";
import OpenAI from "openai";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  authenticate,
  requireActiveSubscription,
  requireCompleteProfile,
} from "@/server/auth.server";
import {
  MONTHLY_TOKEN_CAP,
  addUsage,
  getCurrentPeriod,
  getUsedTokens,
} from "@/server/usage.server";
import { DERIVNOS_PROMPT, buildProfileBlock } from "@/server/derivnos";

function jsonErr(
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

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          // 1. Auth
          const authed = await authenticate(request);
          if (authed instanceof Response) return authed;
          const { userId, email } = authed;

          // 2. Subscription
          const sub = await requireActiveSubscription(userId, email, request);
          if (sub instanceof Response) return sub;

          // 3. Profile complete
          const incomplete = requireCompleteProfile(sub);
          if (incomplete) return incomplete;

          // 4. Usage cap
          const period = getCurrentPeriod(sub.subscription_current_period_end);
          const used = await getUsedTokens(userId, period);
          if (used >= MONTHLY_TOKEN_CAP) {
            console.error("[chat] usage cap hit", userId, used);
            return jsonErr(
              429,
              "You've reached the usage limit for this billing period.",
              `used=${used}`,
              "usage_cap"
            );
          }

          // 5. Body
          const body = (await request.json().catch(() => ({}))) as {
            conversation_id?: string | null;
            content?: string;
          };
          const content = (body.content ?? "").trim();
          if (!content) return jsonErr(400, "Empty message.", "empty_content");
          if (content.length > 8000)
            return jsonErr(400, "Message too long.", "too_long");

          // 6. Secrets
          const apiKey = process.env.OPENAI_API_KEY;
          const assistantId = process.env.OPENAI_ASSISTANT_ID;
          if (!apiKey || !assistantId) {
            console.error("[chat] missing OPENAI secrets", {
              hasKey: !!apiKey,
              hasAssistant: !!assistantId,
            });
            return jsonErr(
              500,
              "AskDerivn is not configured.",
              "missing_openai_secrets",
              "config"
            );
          }
          const openai = new OpenAI({ apiKey });

          // 7. Resolve conversation
          let conversationId = body.conversation_id ?? null;
          let threadId: string | null = null;

          if (conversationId) {
            const { data: conv, error: convErr } = await supabaseAdmin
              .from("conversations")
              .select("id, user_id, openai_thread_id")
              .eq("id", conversationId)
              .single();
            if (convErr || !conv || conv.user_id !== userId) {
              console.error("[chat] conversation not found", convErr?.message);
              return jsonErr(404, "Conversation not found.", "conv_not_found");
            }
            threadId = conv.openai_thread_id;
          } else {
            const title = content.slice(0, 60);
            const { data: created, error: createErr } = await supabaseAdmin
              .from("conversations")
              .insert({ user_id: userId, title })
              .select("id")
              .single();
            if (createErr || !created) {
              console.error("[chat] create conv failed", createErr?.message);
              return jsonErr(
                500,
                "Could not start a new conversation.",
                `create_conv:${createErr?.message ?? "unknown"}`
              );
            }
            conversationId = created.id;
          }

          // 8. Ensure thread
          if (!threadId) {
            try {
              const thread = await openai.beta.threads.create();
              threadId = thread.id;
              await supabaseAdmin
                .from("conversations")
                .update({ openai_thread_id: threadId })
                .eq("id", conversationId);
            } catch (e) {
              const msg = e instanceof Error ? e.message : String(e);
              console.error("[chat] thread create failed", msg);
              return jsonErr(
                502,
                "AskDerivn could not start a session.",
                `thread_create:${msg}`
              );
            }
          }

          // 9. Save user message
          await supabaseAdmin.from("messages").insert({
            conversation_id: conversationId,
            role: "user",
            content,
          });

          // 10. Profile context
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select(
              "display_name, goal, training_level, weekly_schedule, strength_days_per_week, cardio_days_per_week, average_steps, time_per_session, equipment, main_barriers, pain_or_injury_flag, pain_notes, nutrition_tags, nutrition_context, guidance_preference, limitations, other_notes"
            )
            .eq("id", userId)
            .single();

          const additionalInstructions =
            DERIVNOS_PROMPT + "\n\n" + buildProfileBlock(profile);

          // 11. Append user message to OpenAI thread
          let userMessageId: string;
          try {
            const m = await openai.beta.threads.messages.create(threadId!, {
              role: "user",
              content,
            });
            userMessageId = m.id;
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error("[chat] openai message create failed", msg);
            return jsonErr(502, "AskDerivn could not accept the message.", `msg_create:${msg}`);
          }

          // 12. Create + manually poll run
          let run;
          try {
            run = await openai.beta.threads.runs.create(threadId!, {
              assistant_id: assistantId,
              additional_instructions: additionalInstructions,
            });
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error("[chat] run create failed", msg);
            return jsonErr(502, "AskDerivn could not start a response.", `run_create:${msg}`);
          }

          const startedAt = Date.now();
          const MAX_MS = 25_000;
          while (
            run.status === "queued" ||
            run.status === "in_progress" ||
            run.status === "cancelling"
          ) {
            if (Date.now() - startedAt > MAX_MS) {
              console.error("[chat] run timeout", run.id, run.status);
              try {
                await openai.beta.threads.runs.cancel(run.id, { thread_id: threadId! });
              } catch {}
              return jsonErr(
                504,
                "AskDerivn took too long to respond. Please try again.",
                `run_timeout status=${run.status}`,
                "run_timeout"
              );
            }
            await new Promise((r) => setTimeout(r, 1000));
            try {
              run = await openai.beta.threads.runs.retrieve(run.id, {
                thread_id: threadId!,
              });
            } catch (e) {
              const msg = e instanceof Error ? e.message : String(e);
              console.error("[chat] run retrieve failed", msg);
              return jsonErr(502, "AskDerivn lost the connection.", `run_retrieve:${msg}`);
            }
          }

          if (run.status !== "completed") {
            const errMsg = run.last_error?.message ?? "no error message";
            console.error("[chat] run not completed", run.status, errMsg);
            return jsonErr(
              502,
              "AskDerivn could not respond. Please try again.",
              `run_${run.status}:${errMsg}`,
              `run_${run.status}`
            );
          }

          // 13. Track usage
          if (run.usage) {
            try {
              await addUsage(
                userId,
                period,
                run.usage.prompt_tokens ?? 0,
                run.usage.completion_tokens ?? 0
              );
            } catch (e) {
              console.error("[chat] usage update failed", e);
            }
          }

          // 14. Read newest assistant message after the user message
          let assistantText = "";
          try {
            const list = await openai.beta.threads.messages.list(threadId!, {
              order: "asc",
              after: userMessageId,
              limit: 10,
            });
            for (const m of list.data) {
              if (m.role !== "assistant") continue;
              for (const part of m.content) {
                if (part.type === "text") assistantText += part.text.value;
              }
            }
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error("[chat] message list failed", msg);
            return jsonErr(502, "AskDerivn responded but we couldn't read it.", `msg_list:${msg}`);
          }

          if (!assistantText.trim()) {
            console.error("[chat] empty assistant response", run.id);
            return jsonErr(
              502,
              "AskDerivn returned an empty response. Please try again.",
              "empty_assistant_message",
              "empty_response"
            );
          }

          // 15. Save assistant message
          const { data: saved, error: saveErr } = await supabaseAdmin
            .from("messages")
            .insert({
              conversation_id: conversationId,
              role: "assistant",
              content: assistantText,
            })
            .select("id, role, content, created_at")
            .single();

          if (saveErr || !saved) {
            console.error("[chat] save assistant failed", saveErr?.message);
            return jsonErr(500, "Could not save the response.", `save:${saveErr?.message}`);
          }

          await supabaseAdmin
            .from("conversations")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", conversationId);

          return Response.json({
            conversation_id: conversationId,
            message: saved,
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          const stack = e instanceof Error ? e.stack : undefined;
          console.error("[chat] unhandled error", msg, stack);
          return jsonErr(500, "Something went wrong.", `unhandled:${msg}`);
        }
      },
    },
  },
});
