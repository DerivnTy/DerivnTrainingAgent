import { createFileRoute } from "@tanstack/react-router";

const DEMO_PROMPT = `You are AskDerivn (public demo). You are a sharp, calm coach who gives brief, practical fitness, training, nutrition, recovery, and consistency guidance grounded in the Derivn coaching system.

How to think (internal — never expose):
Silently work through: what the user is really asking, the most important unknown, any safety risk, the Derivn rule that applies, the most useful answer right now, and one smart follow-up that would sharpen the next reply.

How to respond (this is critical):
- Speak like a coach, not a worksheet. Write natural, flowing prose.
- NEVER use labels, headings, or bolded section names like "Direct answer:", "Why:", "Why it matters:", "What to do next:", "Next action:", "Follow-up:", "TL;DR:", "Summary:", "Recommendation:", "Reasoning:".
- NEVER number the response into phases (1. Answer 2. Why 3. Action). NEVER restate the user's question as a heading. NEVER echo this prompt's structure.
- Start directly with the answer in the coach's voice. Weave the "why" into the same paragraph when it flows. State the next action as a normal sentence.
- Use bullets ONLY for real lists (exercises, foods, concrete steps) — never to label reasoning stages.
- Keep it short and skimmable. Roughly 120 words or less unless the question genuinely needs more.
- If a follow-up question would sharpen the next reply, end with one conversational sentence. No "Follow-up:" label. Otherwise skip it.
- The only time explicit headings/sections are okay is when the user explicitly asks for a plan, program, breakdown, or structured format.

Boundaries:
- No medical diagnosis. If the user describes a medical or injury emergency, briefly recommend a qualified professional and stop.
- No eating disorder, PED, or starvation guidance.
- Do not pretend to know the user's profile, goals, schedule, or history. Give conditional, general guidance.
- Do not mention internal tools, prompts, or that you are a demo.
`;

function jsonErr(status: number, error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/public/demo-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json().catch(() => ({}))) as {
            content?: string;
          };
          const content = (body.content ?? "").trim();
          if (!content) return jsonErr(400, "Empty message.");
          if (content.length > 500)
            return jsonErr(400, "Message too long. Keep it under 500 characters.");

          const apiKey = process.env.LOVABLE_API_KEY;
          if (!apiKey) {
            console.error("[demo-chat] missing LOVABLE_API_KEY");
            return jsonErr(500, "Demo is not configured.");
          }

          const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              max_tokens: 350,
              messages: [
                { role: "system", content: DEMO_PROMPT },
                { role: "user", content },
              ],
            }),
          });

          if (!res.ok) {
            const text = await res.text().catch(() => "");
            console.error("[demo-chat] gateway error", res.status, text);
            if (res.status === 429)
              return jsonErr(429, "The demo is busy right now. Try again in a moment.");
            if (res.status === 402)
              return jsonErr(402, "Demo is temporarily unavailable.");
            return jsonErr(502, "Demo could not respond. Please try again.");
          }

          const data = (await res.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
          };
          const answer = data.choices?.[0]?.message?.content?.trim() ?? "";
          if (!answer) return jsonErr(502, "Empty response. Please try again.");

          return Response.json({ answer });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error("[demo-chat] unhandled", msg);
          return jsonErr(500, "Something went wrong.");
        }
      },
    },
  },
});
