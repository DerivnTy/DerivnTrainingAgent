# Fix Add‑to‑Home‑Screen Modal

## Problem

`src/components/add-to-home-screen-banner.tsx` uses non‑existent tokens (`bg-paper`, `text-paper`) and one‑off Tailwind classes that drift from the global type/spacing system. Result:

- The "Got it" button is a dark pill with **invisible text** (`text-paper` isn't a defined utility).
- Headings/body use ad‑hoc `font-serif text-2xl`, `text-sm`, `text-xs` instead of `.t-h3 / .t-body / .t-body-sm / .t-eyebrow / .t-meta` used site‑wide.
- The card uses `rounded-3xl shadow-2xl` and `bg-ink/30 backdrop-blur-sm` overlay — feels generic, doesn't match the cream + thin‑rule, no‑shadow AskDerivn look.
- iPhone/Android pills are pill‑shaped grey blobs (`rounded-2xl bg-rule/50`); should be small mono eyebrows.

## Fix

Rewrite the modal with the site's design system. No new tokens needed.

**Overlay**: `bg-ink/40` (no blur — site doesn't use blur elsewhere).

**Card**:
- `bg-background` (cream), `border border-rule`, `rounded-2xl`
- `max-w-md w-full p-8`
- Drop the heavy `shadow-2xl`; use a soft `shadow-sm` (subtle, AskDerivn‑style) or no shadow.

**Content rhythm**:
- Title: `.t-h3` (serif, sized to fit phones — current `text-2xl` was clipping at 390px).
- Subtitle: `.t-body-sm` with `mt-3 text-ink-soft`.
- Instructions block: `mt-8 space-y-4`.
  - Each row: `flex items-start gap-4`
  - Label: `.t-eyebrow` (no background pill, just mono uppercase 11px) with fixed width `w-16` so the two rows align.
  - Body copy: `.t-body-sm`.

**Footer row** (`mt-8 flex items-center justify-between gap-4`):
- Checkbox label: `.t-body-sm text-ink-soft`, accent ink.
- Primary button: `bg-foreground text-background` (this is the fix for the invisible label), `rounded-full px-6 py-2.5 t-eyebrow` (mono uppercase), label "Got it". Subtle hover: `hover:bg-ink-soft` or `hover:opacity-90`.

**Footnote**: `.t-meta text-center mt-6`.

**Smart‑quotes**: keep curly quotes already in copy.

No behavior change (timing, localStorage key, dismissal logic). No new dependencies. Only `src/components/add-to-home-screen-banner.tsx` is touched.

## Acceptance

- "Got it" button shows readable cream text on the dark pill.
- Title, body, mono labels, and footer all match the typography used on /, /login, /admin.
- Card looks like the rest of the site (cream, thin rule, restrained shadow), not a generic rounded modal.
- Renders cleanly at 390px width without clipping.
