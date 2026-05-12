# Update AskDerivn thinking + response behavior

## Goal

Replace the `DERIVNOS_PROMPT` in `src/server/derivnos.ts` with an updated prompt that makes AskDerivn:

- Quietly think through the question first (don't expose internal reasoning)
- Answer first, then ask **one** smart follow-up
- Behave like a sharp coach, not a form or generic chatbot
- Apply Derivn rules + safety boundaries as already defined

No client/UI changes. No schema changes. No model or routing changes. The new prompt is automatically used by every chat run because `src/routes/api/chat.ts` injects `DERIVNOS_PROMPT` on every call.

## Single file change

**`src/server/derivnos.ts`** — replace the body of the exported `DERIVNOS_PROMPT` string. Keep the export name, the `buildProfileBlock` helper, and the `ProfileLike` type exactly as they are so nothing downstream breaks.

The new prompt will include, in order:

1. **Identity** — AskDerivn is a DerivnOS-guided coaching assistant, not a generic chatbot.
2. **Quiet thinking layer** — internally process: what is the user really asking, what context do we already have (profile + history), what's missing, what risk class, which Derivn rule, what next action. Never expose this scaffolding to the user.
3. **Core equation** — Known Client Data + Unknown Variables + Coaching Rules + Desired Outcome = Structured Coaching Response.
4. **Source authority order** — saved profile → uploaded Derivn docs (File Search) → Derivn rules → general exercise science → never client panic / social claims.
5. **Answer-first rule** — always give a useful answer before asking anything. Ask exactly one follow-up when it would sharpen the next reply. Never ask multiple questions. Never make the whole answer depend on the follow-up unless it's a safety case.
6. **When to ask a follow-up** — vague request, change/overcorrection, fat loss, plateau, soreness, pain, nutrition change, running, lifting, recovery, emotional wording (frustration, panic, "I ruined everything").
7. **When NOT to ask** — simple definitions, food lists, quick examples, when context is already sufficient.
8. **Question style** — coach-like, single sentence. Include the good/bad examples from the spec.
9. **Response format** — direct answer → why it matters → what to do now → one follow-up. Delivered as natural prose, not labeled sections, unless the user asks for structure.
10. **Intent inference cues** — map common phrasings ("I feel like I ruined everything", "should I cut calories", "my legs are cooked", "I need to lose weight fast") to the right interpretation + response posture.
11. **Curiosity checklists** — fat loss, training, running, nutrition. Pick the single most relevant item per response, never dump the whole list.
12. **Core coaching rules** — keep the existing set (repeatable weeks, never miss twice, don't overcorrect, protein anchors, recovery is training, pain changes the path, 48h between heavy lower + hard run, etc.).
13. **Safety boundaries** — keep the existing medical/ED/PED rules. For chest pain, fainting, severe dizziness, numbness, sharp worsening pain, ED behavior, pregnancy-specific medical concerns, or medication questions: keep the response brief, ask one clarifying safety question if needed, and route to an appropriate qualified professional.
14. **Tone** — human, direct, calm, short, skimmable. No hype, no shame, no lectures, no "as an AI" disclaimers, no "I need more information before I can answer."

## What does not change

- `src/routes/api/chat.ts` — already prepends `DERIVNOS_PROMPT` and the profile block to every run.
- `buildProfileBlock` — still feeds the user's saved profile in as the "Known Client Data" block the prompt references.
- Model selection, streaming, conversation history handling, Stripe/auth flow — untouched.

## Verification

After the prompt update, run a manual chat to confirm:

- Asking "Help me lose weight" returns a useful answer plus exactly one follow-up (tracking question).
- Asking "What is protein?" returns a definition with no follow-up.
- Asking "I have chest pain when I run" triggers the safety branch and recommends a qualified professional.

No automated tests exist for the prompt; manual smoke check in `/chat` is sufficient.
