## Goal
Make every piece of text on the site use the design-system typography tokens defined in `src/styles.css` (`t-display`, `t-h1`, `t-h2`, `t-h3`, `t-eyebrow`, `t-body`, `t-body-sm`, `t-meta`, `t-wordmark`) so sizing, weight, family and color are consistent and readable in the right contexts.

No new fonts, no new tokens — just consistent application of what exists.

## What I found

The token system is solid, but several files still use raw Tailwind utilities (`text-xs`, `text-sm`, `font-serif text-base`, `text-sm text-red-700`, etc.). A few placements also hurt readability — most notably the chat conversation body and the "Done" CTA in the Add-to-Home-Screen banner.

### Issues to fix

1. **Chat conversation copy is too small** — `_authenticated.chat.tsx` lines 212, 226: user + assistant messages use `text-sm` (14px). Chat is the primary surface; bump to `t-body` (16px) so paragraphs read comfortably on mobile.
2. **Suggestion card subtitle** — line 266 uses `text-xs text-ink-soft`; replace with `t-meta` (same intent, semantic).
3. **Chat input field** — line 284 uses raw `text-sm`; switch to `t-body` so what you type matches what you read.
4. **A2HS "Done" CTA** — `add-to-home-screen-banner.tsx` line 98 styles a primary button with `t-eyebrow` (11px uppercase mono). Replace the inline classes with `btn-primary` so it matches every other primary action on the site.
5. **PDF dialog header** — `pdf-viewer-dialog.tsx` line 19 uses `font-serif text-base`; replace with `t-wordmark` for a consistent brand mark.
6. **PDF dialog "Open in new tab" link** (line 26) and body copy (line 49): switch `text-xs` → `t-meta`, `text-sm` → `t-body-sm`.
7. **Error messages** — `text-sm text-red-700` appears in login, signup, reset-password, forgot-password, subscribe, account, onboarding, chat. Standardize to a single class. Add a small component class `.t-error` in `styles.css` ( `t-body-sm` weight, `var(--destructive)` color) and apply it everywhere.
8. **Helper / hint copy under inputs** — `_authenticated.account.tsx` and `_authenticated.onboarding.tsx` use `text-xs text-ink-soft` for hints, char-counts, and footnotes. Replace with `t-meta` (12px, ink-soft) — same look, semantic.
9. **Form input fields** — account, onboarding, login, signup, reset, forgot, rename dialog all use `text-sm` on `<input>`. Move them to `t-body-sm` for one source of truth (same 14px, sans, but consistent).
10. **Account page small UI bits** — `<dd className="text-sm">` (line 569), pill chips `text-sm` (lines 613/646/427/460), sign-out & section labels — replace plain `text-sm` body copy with `t-body-sm`; leave button-shaped pills using `text-sm` alone (their pill class controls the rest).
11. **Index hero subtext** — `t-body text-lg` (index line 49) double-sets size. Drop `text-lg` and let `t-body` rule, or define the larger size inline only — pick `t-body` and add `md:text-lg` for desktop emphasis.
12. **Index nav** — `<nav className="... text-sm">` (line 30): change to `t-body-sm` for parity with footer/utility nav.
13. **Post-auth status row** uses `t-body-sm` already — leave.
14. **Drawer/Dialog/Tooltip shadcn primitives** — these come from shadcn and are used by Lovable internals; leave their defaults alone unless they appear visually in our screens. Spot-check Dialog title/description in the rename and delete modals — currently fine because they sit on `t-h?` parents. No change.

### What I will NOT change
- Headings already on `t-display` / `t-h1` / `t-h2` / `t-h3`.
- Wordmark spots already on `t-wordmark`.
- Pricing display `font-serif text-5xl/3xl` — intentional editorial flourish.
- shadcn `ui/*` primitives (badges, alerts, etc.) unless surfaced in user screens.
- Sidebar items (just updated last turn).

## Files to edit
- `src/styles.css` — add `.t-error` helper class.
- `src/routes/_authenticated.chat.tsx`
- `src/routes/_authenticated.account.tsx`
- `src/routes/_authenticated.onboarding.tsx`
- `src/routes/login.tsx`
- `src/routes/signup.tsx`
- `src/routes/reset-password.tsx`
- `src/routes/forgot-password.tsx`
- `src/routes/subscribe.tsx`
- `src/routes/index.tsx`
- `src/components/add-to-home-screen-banner.tsx`
- `src/components/pdf-viewer-dialog.tsx`
- `src/components/app-sidebar.tsx` (rename input only)

## Verification
After edits I'll re-grep for stray `text-xs`, `text-sm text-red-700`, and `font-serif text-` outside `ui/*` and confirm only intentional uses remain, then visually spot-check the chat, landing, login, account, and onboarding screens at the 390px mobile viewport.
