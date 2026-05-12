import { createFileRoute } from "@tanstack/react-router";
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

const MODEL = "google/gemini-3-flash-preview";
const HISTORY_LIMIT = 30;

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

          // 6. Lovable AI Gateway key
          const apiKey = process.env.LOVABLE_API_KEY;
          if (!apiKey) {
            console.error("[chat] missing LOVABLE_API_KEY");
            return jsonErr(
              500,
              "AskDerivn is not configured.",
              "missing_lovable_api_key",
              "config"
            );
          }

          // 7. Resolve conversation
          let conversationId = body.conversation_id ?? null;
          if (conversationId) {
            const { data: conv, error: convErr } = await supabaseAdmin
              .from("conversations")
              .select("id, user_id")
              .eq("id", conversationId)
              .single();
            if (convErr || !conv || conv.user_id !== userId) {
              console.error("[chat] conversation not found", convErr?.message);
              return jsonErr(404, "Conversation not found.", "conv_not_found");
            }
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

          // 8. Load conversation history
          const { data: history } = await supabaseAdmin
            .from("messages")
            .select("role, content, created_at")
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: true })
            .limit(HISTORY_LIMIT);

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

          const systemPrompt =
            DERIVNOS_PROMPT + "\n\n" + buildProfileBlock(profile);

          const messages: Array<{ role: string; content: string }> = [
            { role: "system", content: systemPrompt },
          ];
          for (const m of history ?? []) {
            if (m.role === "user" || m.role === "assistant") {
              messages.push({ role: m.role, content: m.content });
            }
          }
          messages.push({ role: "user", content });

          // 11. Call Lovable AI Gateway with streaming
          let upstream: Response;
          try {
            upstream = await fetch(
              "https://ai.gateway.lovable.dev/v1/chat/completions",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: MODEL,
                  messages,
                  stream: true,
                }),
              }
            );
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error("[chat] gateway fetch failed", msg);
            return jsonErr(502, "AskDerivn could not respond. Please try again.", `gw_fetch:${msg}`);
          }

          if (!upstream.ok || !upstream.body) {
            const text = await upstream.text().catch(() => "");
            console.error("[chat] gateway error", upstream.status, text);
            if (upstream.status === 429)
              return jsonErr(
                429,
                "AskDerivn is busy right now. Try again in a moment.",
                `gw_429:${text}`,
                "rate_limited"
              );
            if (upstream.status === 402)
              return jsonErr(
                402,
                "AskDerivn is temporarily over capacity. Please try again shortly.",
                `gw_402:${text}`,
                "credits_exhausted"
              );
            return jsonErr(
              502,
              "AskDerivn could not respond. Please try again.",
              `gw_${upstream.status}:${text}`
            );
          }

          // 12. Tee the body: one branch goes to client, the other to persistence
          const [clientStream, persistStream] = upstream.body.tee();

          // Background: accumulate the assistant text + usage, then save
          const persistPromise = (async () => {
            const reader = persistStream.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let assistantText = "";
            let promptTokens = 0;
            let completionTokens = 0;
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                let nl: number;
                while ((nl = buffer.indexOf("\n")) !== -1) {
                  let line = buffer.slice(0, nl);
                  buffer = buffer.slice(nl + 1);
                  if (line.endsWith("\r")) line = line.slice(0, -1);
                  if (!line.startsWith("data: ")) continue;
                  const json = line.slice(6).trim();
                  if (!json || json === "[DONE]") continue;
                  try {
                    const parsed = JSON.parse(json);
                    const delta = parsed.choices?.[0]?.delta?.content;
                    if (typeof delta === "string") assistantText += delta;
                    if (parsed.usage) {
                      promptTokens = parsed.usage.prompt_tokens ?? promptTokens;
                      completionTokens =
                        parsed.usage.completion_tokens ?? completionTokens;
                    }
                  } catch {
                    // partial JSON across chunks — put back and wait
                    buffer = line + "\n" + buffer;
                    break;
                  }
                }
              }
            } catch (e) {
              console.error("[chat] persist stream read error", e);
            }

            if (assistantText.trim()) {
              try {
                await supabaseAdmin.from("messages").insert({
                  conversation_id: conversationId,
                  role: "assistant",
                  content: assistantText,
                });
                await supabaseAdmin
                  .from("conversations")
                  .update({ updated_at: new Date().toISOString() })
                  .eq("id", conversationId);
              } catch (e) {
                console.error("[chat] save assistant failed", e);
              }
            }

            if (promptTokens || completionTokens) {
              try {
                await addUsage(userId, period, promptTokens, completionTokens);
              } catch (e) {
                console.error("[chat] usage update failed", e);
              }
            }
          })();

          // Make sure persist runs to completion in the background
          persistPromise.catch((e) => console.error("[chat] persist task", e));

          // 13. Build response: prepend a meta event with conversation_id, then
          // forward the gateway SSE body unchanged.
          const encoder = new TextEncoder();
          const metaEvent = encoder.encode(
            `event: meta\ndata: ${JSON.stringify({ conversation_id: conversationId })}\n\n`
          );

          const reader = clientStream.getReader();
          const out = new ReadableStream({
            async start(controller) {
              controller.enqueue(metaEvent);
              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  controller.enqueue(value);
                }
              } catch (e) {
                console.error("[chat] client stream forward error", e);
              } finally {
                controller.close();
              }
            },
          });

          return new Response(out, {
            status: 200,
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache, no-transform",
              Connection: "keep-alive",
              "X-Accel-Buffering": "no",
            },
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
