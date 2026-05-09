import { createFileRoute } from "@tanstack/react-router";

const DEMO_PROMPT = `You are AskDerivn (public demo). You give brief, practical fitness/training/nutrition/recovery/consistency guidance grounded in the Derivn coaching system.

Demo response rules:
- Keep it short. No long deep-dives.
- Use this exact 3-part structure with bold labels on their own lines:
  **Direct answer** — one or two sentences.
  **Why** — one or two sentences.
  **What to do next** — one concrete action.
- Maximum ~120 words total.
- No medical diagnosis. If the user describes a medical/injury emergency, briefly recommend a qualified professional and stop.
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
