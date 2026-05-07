## Goal

Make `/chat` feel quiet and empty like the reference screenshot. Right now the empty state stacks a big serif "AskDerivn" headline, an instructional paragraph, and an 8-tile starter grid — that's the "noise" the user is reacting to.

The top bar already shows "AskDerivn" centered on mobile, so the in-page headline is redundant.

## Changes (only `src/routes/_authenticated.chat.tsx`)

1. **Remove the empty-state header block**
   - Delete the `<h1>AskDerivn</h1>` and the "Ask a question about training…" paragraph that render when there's no conversation and no messages.

2. **Trim and restyle the starters**
   - Cut `STARTERS` from 8 prompts down to 2, matching the reference:
     - "Plan my week" / *"so I train, run, and recover right"*
     - "Fix my fat loss" / *"without killing my running"*
   - Render each as a soft rounded card (title in bold, subtitle in muted text) in a 2-column grid pinned just above the input, instead of a full-width 8-button grid up top.
   - Keep them clickable → still call `send(title)`.

3. **Quiet the input row**
   - Drop the top border on the input container; use a subtle pill-style wrapper (rounded, light surface bg) so it sits like the reference.
   - Replace the textarea with a single-line `input` (Enter submits, Shift+Enter not needed for this UI). Placeholder: "Ask AskDerivn".
   - Replace the text "SEND" button with a small circular icon button (arrow-up icon from lucide) on the right; disabled state stays.

4. **Whitespace**
   - With the headline + grid gone, the scroll area naturally becomes mostly empty whitespace until the user types — matching the reference. No extra layout work needed.

Out of scope: sidebar, top strip, message bubbles when a conversation exists, colors/tokens beyond using existing `bg-accent` / `text-ink-soft` / `border-rule`. No logic, auth, or API changes.

## Technical notes

- File touched: `src/routes/_authenticated.chat.tsx` only.
- `STARTERS` becomes `Array<{ title: string; sub: string }>`; `send()` is unchanged and receives only the title.
- Use `lucide-react`'s `ArrowUp` for the send button (already a dependency via other components).
- Keep `AddToHomeScreenBanner` mounted as-is.
