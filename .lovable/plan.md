Restructure the authenticated experience so AskDerivn feels like a private chat product, not a multi-page app. The chat IS the app; PDF/profile/account become small utility links inside the sidebar.

## Layout shift

Replace the current `_authenticated.tsx` top-nav header + outlet with a two-column shell:

```text
┌──────────────────────────┬───────────────────────────────────┐
│ AskDerivn                │                                   │
│ ─ New chat               │   (route outlet renders here —    │
│                          │    chat transcript, profile form, │
│ Conversations            │    account, or resource page)     │
│ • Plan my week           │                                   │
│ • Fix my fat loss        │                                   │
│ • …                      │                                   │
│                          │                                   │
│ ──────────────           │                                   │
│ PDF · Profile · Account  │                                   │
│ Sign out                 │                                   │
└──────────────────────────┴───────────────────────────────────┘
```

- Left sidebar: fixed width (`w-64`), `border-r border-rule`, full-height, cream background. Contains:
  - Wordmark "AskDerivn" (links to `/chat`)
  - "+ New chat" text button
  - Scrollable conversation list (most recent first; click to open; hover shows Rename / Delete)
  - Bottom utility block: small text links for **PDF**, **Profile**, **Account**, **Sign out** (mono labels)
- Main column: full-height flex container that hosts `<Outlet />`. No top header bar.
- Mobile (< md): sidebar collapses to a slide-over. A small "Menu" text button + current chat title sits in a thin top strip on mobile only. Reuse shadcn `Sheet` so we don't add new tokens.

The sidebar mounts a single `<ConversationsList>` that fetches via `/api/conversations` and lives in `_authenticated.tsx`. It accepts the active conversation id from a tiny context (or URL param) so the chat route can highlight the current row and trigger refetches when a new chat is created.

## Conversation routing

Move from in-memory chat state to URL-addressable conversations so the sidebar/list and chat view stay in sync naturally:

- `/chat` — empty state (starter prompts + input). Sending the first message creates the conversation and `navigate({ to: '/chat/$id', params: { id } })`.
- `/chat/$id` — loads that conversation's messages.

Files:
- `src/routes/_authenticated.chat.index.tsx` (new) — empty state.
- `src/routes/_authenticated.chat.$id.tsx` (new) — loaded conversation.
- Or, simpler: keep a single `_authenticated.chat.tsx` that reads an optional search param `?c=<id>`. Pick the search-param approach to avoid an extra layout file — same UX, less churn.

Decision: **use `?c=<id>` search param**. Sidebar links use `<Link to="/chat" search={{ c: id }}>`. The chat component reads `Route.useSearch()` and reloads on change.

## Chat view (cleanup pass on existing component)

The chat component already exists. Strip its built-in sidebar (now lives in the layout) and:
- Render only: title + supporting line (top), transcript (middle), input (bottom).
- Empty state shows the 8 starter prompts in a 2-col grid; hide as soon as messages exist.
- Keep the markdown rendering, "You" / "AskDerivn" mono labels, thin rules between turns.
- After a successful send that creates a new conversation, push the new id into the URL and refresh the sidebar list (lift this via the shared sidebar context or a simple `window.dispatchEvent` channel — context is cleaner; use it).

## Routing rules (post-auth)

Already correct from the previous pass; confirm:
- not signed in → `/login`
- signed in, no active sub → `/subscribe`
- signed in, active sub, profile incomplete → `/onboarding`
- signed in, active sub, profile complete → `/chat`

## Profile / PDF / Account pages

Keep the existing pages but:
- Render them inside the new sidebar shell (so they appear in the right pane while the sidebar stays put).
- Remove their bottom links/redundancy that previously compensated for missing nav (e.g. the "Built for Motion PDF" / "Update profile" buttons on `/account` are no longer required since they're in the sidebar — keep "Manage billing" and "Sign out" only on `/account` to avoid duplicating the sidebar).
- Profile, PDF, Account remain at their current routes — only their visual frame changes.

## Header changes

- `_authenticated.tsx`: remove the top header (`Chat · PDF · Profile · Account`) entirely. Sidebar replaces it.
- The global `SiteFooter` should NOT render inside the authenticated app shell (it's a marketing footer; doesn't fit a chat product). Keep it on landing/auth pages.

## Out of scope for this turn

- Emailing the PDF after subscription (mentioned but separate work — flag it; will need email infrastructure setup; do in a follow-up).
- Streaming chat responses.
- Mobile polish beyond the slide-over sidebar.
- Conversation auto-titling via LLM (we already use first 60 chars).

## Files

New:
- `src/components/app-sidebar.tsx` — the sidebar UI (wordmark, New chat, conversation list, utility links, sign out).
- `src/lib/chat-context.tsx` — tiny React context exposing `{ activeId, setActiveId, refreshConversations, conversationsVersion }` for sidebar/chat coordination.

Edited:
- `src/routes/_authenticated.tsx` — replace header+outlet with sidebar+outlet shell, drop `SiteFooter`, provide `ChatContext`.
- `src/routes/_authenticated.chat.tsx` — strip internal sidebar, read `?c=<id>` search param, write back into URL after first send, call `refreshConversations()` after sends.
- `src/routes/_authenticated.account.tsx` — drop the duplicated "Update profile" / "Built for Motion PDF" buttons; keep Manage billing + Sign out (Sign out can stay as a fallback even though sidebar has one).
- (No backend changes. No new dependencies. No new design tokens.)

## Visual rules (unchanged)

Cream background, ink text, thin rules, serif headings, mono labels for sidebar items, no cards, no gradients, no SaaS chrome. Sidebar links in `text-ink-soft` with `text-foreground` on active/hover.
