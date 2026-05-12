## Goal

Update `DERIVNOS_PROMPT` in `src/server/derivnos.ts` so AskDerivn keeps using its internal reasoning framework but stops outputting it as labeled sections ("Direct answer:", "Why it matters:", "What to do now:", "One smart follow-up question:"). Responses should read like a sharp coach talking, not a worksheet.

## Single file change

**`src/server/derivnos.ts`** — rewrite the `RESPONSE FORMAT` section and tighten related rules. Keep `buildProfileBlock`, the `ProfileLike` type, and the export name unchanged.

### What changes in the prompt

1. **Strengthen the "internal vs. external" split.** Keep the existing QUIET THINKING LAYER but add an explicit rule: the four-part structure (answer → why → next action → optional follow-up) is an *internal* shape only. Never surface it as labels, headings, or bolded section names.

2. **Replace the current RESPONSE FORMAT section** with output rules that explicitly forbid:
   - Labels like "Direct answer:", "Why it matters:", "What to do now:", "Follow-up:", "TL;DR:", "Summary:".
   - Bolded section headers, numbered phases, or template scaffolding.
   - Any phrasing that reads like a worksheet, checklist, or system prompt echo.
   - Restating the user's question back as a heading.

   And require:
   - Start directly with the answer in the coach's voice.
   - Use short natural paragraphs. Bullets only when listing real items (exercises, foods, steps in a workout) — never to label reasoning stages.
   - Weave the "why" into the same paragraph as the answer when possible.
   - Put the next action as a normal sentence, not a labeled step.
   - The follow-up question, when used, is a single conversational sentence at the end — no label, no "Quick question:" prefix required (optional soft lead-in like "One thing I'd want to know" or "Quick check —" is fine but not mandatory).
   - Only use explicit headings/sections when the user asks for a breakdown, plan, program, or structured format.

3. **Add 2–3 inline good/bad examples** modeled on the user's examples (returning-from-time-off workout, "help me lose weight", sore-legs run question) so the model has concrete style anchors. Each example shows the bad labeled version and the good natural version side by side.

4. **Keep untouched:** identity, source authority order, answer-first rule, when-to-ask vs. when-not-to-ask, intent inference cues, curiosity checklists, core coaching rules, safety boundaries, tone.

### What does not change

- `src/routes/api/chat.ts` — already injects `DERIVNOS_PROMPT` on every run, no edit needed.
- `src/routes/api/public/demo-chat.ts` — uses its own `DEMO_PROMPT` with a deliberately different short 3-part structure for the public demo. Out of scope unless you want the demo updated too (flagging for confirmation below).
- Model, streaming, history, profile injection, auth, Stripe — untouched.

## Verification

Manual smoke test in `/chat` after the prompt update:
- "What should I do for a workout today?" → flowing prose + clean exercise bullets, no "Direct answer:" labels, ends with at most one natural follow-up question.
- "Help me lose weight." → conversational answer, no template headings, single follow-up about tracking.
- "Should I run today if my legs are sore?" → natural recovery guidance, single follow-up about yesterday's session.
- "What is protein?" → short definition, no follow-up, no labels.
- "Give me a structured 4-week plan." → structured/sectioned output is allowed here because the user asked for structure.

## One thing to confirm

Do you also want the same "no labeled sections" rewrite applied to the **public demo** prompt in `src/routes/api/public/demo-chat.ts`? It currently *requires* `**Direct answer**`, `**Why**`, `**What to do next**` bold labels by design. If yes, I'll update it in the same pass; if no, I'll leave the demo as-is.