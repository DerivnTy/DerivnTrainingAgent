## Goal

Make replies feel instant on both the home demo and the authenticated chat. Today users wait 5–15s because we use the OpenAI Assistants API (thread create + 1s polling) and never stream — the whole reply lands at once. After this change, the first words appear in well under a second and stream in token‑by‑token.

## What changes for the user

- Home demo: starts answering almost immediately, words appear as they're generated.
- Authenticated chat: same — no more "Thinking…" spinner sitting for 10+ seconds.
- Tone and behavior stay the same (the full DerivnOS coaching prompt is preserved).
- File Search over uploaded Derivn PDFs is removed (per your choice). The model will rely on the system prompt + your saved profile + conversation history, which is what makes the actual coaching voice anyway.

## Technical changes

### 1. Authenticated chat — `src/routes/api/chat.ts` (the big win)

Replace the OpenAI Assistants flow with a streaming Lovable AI Gateway call.

- Remove: thread create, message create, run create, the 1s polling loop, run cancel, message list. Remove `openai_thread_id` usage from the request path (column can stay in DB, just unused).
- Keep: auth + subscription + profile + usage cap checks, saving the user message, saving the assistant message at the end, conversation create/update.
- New flow:
  1. Load conversation history from `messages` table (last ~30 turns, ascending).
  2. Build messages array: `system: DERIVNOS_PROMPT + profile block`, then history, then new user message.
  3. POST to `https://ai.gateway.lovable.dev/v1/chat/completions` with `model: "google/gemini-3-flash-preview"`, `stream: true`.
  4. Pipe the SSE response straight back to the client (`Content-Type: text/event-stream`). Tee a parallel reader that accumulates `choices[0].delta.content` so we can save the full assistant message + token usage to Supabase after `[DONE]`.
  5. Surface 429 (rate limit) and 402 (credits) as JSON errors before opening the stream, the way the docs require.

Side effects:
- `OPENAI_API_KEY` and `OPENAI_ASSISTANT_ID` are no longer needed by `/api/chat`. We'll leave the secrets in place (no deletion) in case you want to restore Assistants later.
- Token usage tracking switches from `run.usage` to the gateway's `usage` field on the final SSE chunk (same `prompt_tokens` / `completion_tokens` shape).

### 2. Authenticated chat UI — `src/routes/_authenticated.chat.tsx`

Switch `send()` from `await res.json()` to streaming:

- Use `fetch(...).body.getReader()` + a line-by-line SSE parser (per the AI Gateway streaming guide — handle CRLF, `:` keepalives, `[DONE]`, partial JSON across chunks, final flush).
- Optimistically append an empty assistant message right after the user message (no more "Thinking…" placeholder), then update its `content` as each delta arrives.
- On `[DONE]`, call `refreshConversations()` and, for a brand-new conversation, navigate to `/chat?c=<id>` (the server returns the conversation_id in the first SSE event as a custom `event: meta` line; see Technical details below).
- Keep all existing 401 / 402 / 428 / 429 / 5xx handling.

### 3. Home demo — `src/routes/api/public/demo-chat.ts` + `src/components/demo-section.tsx`

Same treatment, simpler:

- Server: switch from non-streaming `fetch` + `res.json()` to streaming. Forward the gateway's SSE body with the same CORS/error handling. Keep the 500-char input cap and the demo prompt.
- Client (`demo-section.tsx`): replace the `await res.json()` with the same SSE reader + progressive render of the answer bubble.

### 4. Small UX polish that compounds the perceived speed

- Submit the user's message into the UI synchronously (already done) and disable the input only while the network request is in flight, not after streaming has started, so the screen is never blank waiting.
- Auto-scroll the chat container as tokens arrive.
- No retries on the client (a fast failure + clear toast is faster than silent retries).

## Out of scope (not changing now)

- Conversation list, sidebar, auth, profile, billing, Stripe, PDF dialog — untouched.
- DB schema — no migration needed. `openai_thread_id` column stays as nullable/legacy.
- Model choice is fixed to `google/gemini-3-flash-preview`. We can A/B against `gemini-2.5-flash-lite` or `gpt-5-nano` later if we want to push latency even lower.

## Technical details (for reference)

- First-token latency target: < 800ms p50, < 1.5s p95. Most of the win comes from removing the Assistants `runs.create` + 1s `runs.retrieve` polling cycle (which alone adds 2–8s before any text exists).
- SSE forwarding from a TanStack server route: return `new Response(upstream.body, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", ...corsHeaders }})`. To also persist the assistant message, use `upstream.body.tee()` — pipe one branch to the client, consume the other in a background `Promise` that writes to Supabase on completion.
- Conversation ID for new chats: emit a single `event: meta\ndata: {"conversation_id":"..."}\n\n` line before forwarding the gateway stream. The client parses meta events separately from `data:` deltas.
- Error mapping (gateway → client): 429 → "Demo is busy, try again." / 402 → "AskDerivn is temporarily over capacity." / other → generic "Couldn't respond, try again." Surface as toasts in chat, inline in demo.
