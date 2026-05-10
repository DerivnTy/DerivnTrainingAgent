## Goal

Audit the entire site, codify a single typography & spacing system, then fix every off-system spot. The look the user is after — Apple / Stripe / Linear / Notion — comes from **scale discipline** (one heading scale, one body scale, one eyebrow style) and **vertical rhythm consistency**, not from new fonts.

The current foundation is already strong: `--font-serif` (Cormorant Garamond) for display, `--font-sans` (system / Inter) for body, `--font-mono` for eyebrows, plus `ink` / `ink-soft` / `rule` color tokens. The drift is in *how* these are used per page.

## Type system to codify (in `src/styles.css`)

Add a single set of named classes so every page uses the same scale instead of ad-hoc Tailwind sizes.

| Class | Use | Spec |
|---|---|---|
| `.t-display` | Hero only (homepage `<h1>`) | serif, 60/72 → md:96, `tracking-tight`, `leading-[1.02]` |
| `.t-h1` | Page title (`/login`, `/signup`, `/account`, `/onboarding`, `/subscribe`, error pages) | serif, 36 → md:44, `tracking-tight`, `leading-[1.05]` |
| `.t-h2` | Major section heading | serif, 32 → md:40, `tracking-tight`, `leading-[1.1]` |
| `.t-h3` | Card/item heading | serif, 20, `tracking-tight`, `leading-snug` |
| `.t-eyebrow` | Mono label above a heading or section | mono, 11px (was mixed 10/12), uppercase, `tracking-[0.14em]`, `text-ink-soft` |
| `.t-body` | Default body | sans, 16, `leading-[1.6]`, `text-foreground` |
| `.t-body-sm` | Secondary body, helper text | sans, 14, `leading-[1.55]`, `text-ink-soft` |
| `.t-meta` | Small UI meta (timestamps, footer) | sans, 12, `leading-normal`, `text-ink-soft` |
| `.t-wordmark` | "AskDerivn" wordmark in headers | serif, 18, `tracking-tight` |

Also add base resets in `@layer base`:
- `h1, h2, h3, h4 { font-family: var(--font-serif); letter-spacing: -0.01em; }` so any forgotten heading inherits the system.
- `p { line-height: 1.6; }` body default.
- Set `font-feature-settings: "ss01", "kern"` on body for tighter sans rendering (Apple-style).

Keep Tailwind utility classes available — these `.t-*` classes are additive, not a replacement, so existing primitive components in `src/components/ui/*` (which use `text-sm`, `text-xs`, etc. semantically for menus/tooltips/etc.) are not touched.

## Drift to fix (file-by-file)

### `src/routes/__root.tsx` — error & 404 pages
- Currently uses `text-7xl font-bold` (sans, bold) for "404" and `text-xl font-semibold tracking-tight` for the error H1. Off-brand.
- Fix: 404 number → `.t-display` (serif). Subhead "Page not found" → `.t-h2`. Body → `.t-body-sm`. Error page H1 → `.t-h1`.

### `src/routes/subscribe.tsx`
- Price `$30` is `text-5xl`; the homepage Pricing section is `text-3xl md:text-4xl`. Pick **one** scale — use `text-3xl md:text-4xl` here too so the price feels the same everywhere.
- H1 "AskDerivn Membership" → `.t-h1`.
- Wordmark in header → `.t-wordmark`.
- Bullet list `text-sm` → `.t-body-sm`.

### `src/routes/login.tsx` & `src/routes/signup.tsx`
- AuthShell page title `font-serif text-4xl tracking-tight` → `.t-h1` + add `leading-[1.05]`.
- Subtitle `mt-3 text-sm text-ink-soft` → bump to `.t-body` muted variant (`text-base text-ink-soft leading-[1.6]`) so the page intro reads at body weight, not helper-text weight (matches Stripe/Linear sign-in pages).
- Bottom marketing block H2 `text-2xl` → `.t-h3` (it's a card subhead, not a section heading) so it stops competing with the page title.
- Wordmark → `.t-wordmark`.
- Field `<span>` eyebrow → `.t-eyebrow`.
- Helper "Forgot password?" / "New here?" / "Already have an account?" lines → `.t-body-sm`.
- "What you get with AskDerivn" bullet list copy → `.t-body-sm`.

### `src/routes/index.tsx` (homepage)
- Hero H1 already `text-6xl md:text-8xl leading-[1.02]` → keep, alias to `.t-display`.
- Hero subtitle `text-lg md:text-xl` → standardize to `.t-body` at `text-lg leading-[1.55]`.
- Section H2s already `text-4xl md:text-5xl` → alias to `.t-h2` (drop the md jump to one tier so it's not bigger than the hero feel — `text-3xl md:text-4xl`). This pulls the page into a tighter scale.
- "What you get" item H3 (`text-xl`) → `.t-h3`.
- Pricing eyebrow (`text-xs tracking-wider`) → `.t-eyebrow`.
- "Ready when you are." section H2 → `.t-h2`.

### `src/components/demo-section.tsx`
- H2 → `.t-h2`.
- The serif callout (`text-xl`) → `.t-h3`.
- All supporting copy → `.t-body-sm`.

### `src/routes/_authenticated.account.tsx`
- H1 → `.t-h1`.
- Section H2 (`text-2xl`) → `.t-h2` for consistency with other section headings (currently feels small for a top-level account section).
- Eyebrows `text-xs uppercase tracking-wider` → `.t-eyebrow`.
- `<dt>` labels → `.t-eyebrow`.

### `src/routes/_authenticated.onboarding.tsx`
- H1 → `.t-h1`.
- Step heading (`font-serif text-xl tracking-tight`) → `.t-h3`.
- Body copy → `.t-body-sm`.

### `src/routes/_authenticated.chat.tsx`
- Eyebrows → `.t-eyebrow`.
- Empty-state heading `AskDerivn` (currently `font-serif`) → `.t-h2`.
- Input placeholder & messages stay on default body sans.

### `src/routes/_authenticated.resource.tsx`
- Eyebrow → `.t-eyebrow`.
- H1 → `.t-h1`.

### `src/routes/_authenticated.tsx` (top bar)
- `<span className="font-serif text-base">AskDerivn</span>` → `.t-wordmark`.

### `src/components/app-sidebar.tsx`
- Sidebar wordmark → `.t-wordmark`.
- All `text-xs uppercase tracking-wider` and the one `text-[10px]` (conversation timestamps) → unify to `.t-eyebrow` (single 11px size, ends the 10/12 split).

### `src/components/site-footer.tsx`
- Footer copy `text-xs text-ink-soft` → `.t-meta`.

### `src/routes/post-auth.tsx`, `forgot-password.tsx`, `reset-password.tsx`
- AuthShell-style headings → `.t-h1`. Helper text → `.t-body-sm`. Eyebrows → `.t-eyebrow`.

## Vertical-rhythm rules (applied where headings sit above content)

Tighten the spacing between heading and supporting copy so the page feels intentional, not loose:

| Pair | Gap |
|---|---|
| Eyebrow → heading below it | `mt-2` (8px) |
| Heading → subtitle directly under it | `mt-3` (12px) |
| Subtitle → first content block | `mt-8` (32px) |
| Section break (between major sections divided by `border-t border-rule`) | already `py-20` md / `py-14` mobile — keep |
| List items / vertical lists | `space-y-3` for body, `space-y-2` for tight UI lists |

Sweep the touched files and replace any `mt-4`/`mt-5`/`mt-6` between headings & their direct subtitles with `mt-3`. Replace any `mt-10` between subtitle → first block with `mt-8`.

## What is intentionally **not** changing

- shadcn primitive components in `src/components/ui/*` (menus, tooltips, dialogs, dropdowns) keep their internal `text-sm` / `text-xs` — those are component-internal, not content typography.
- Color tokens (`background`, `foreground`, `ink`, `ink-soft`, `rule`) — already correct.
- Button sizes (`h-10`, `h-12`) — already on-system from the recent auth pass.
- Fonts loaded — Cormorant Garamond + system sans + system mono. No new fonts.
- Layout, copy, and section structure.

## Acceptance

- `rg "text-(7xl|8xl|6xl|5xl|4xl|3xl|2xl|xl)" src/routes src/components/{site-footer,demo-section,app-sidebar}.tsx` returns only the homepage hero (`.t-display`) — every other large size is replaced by a `.t-*` class.
- All page H1s render at the same size across `/login`, `/signup`, `/subscribe`, `/account`, `/onboarding`, `/_authenticated/resource`, and the error pages.
- All eyebrows render at the same size & tracking site-wide.
- Mobile preview at 390px shows headings that don't wrap awkwardly and body copy at 16px (no more `text-sm` page intros).
- Light spot-check on desktop: section rhythm consistent across home, subscribe, account.

## Out of scope

- No new fonts or icon system.
- No dark-mode rebalancing (tokens already exist; reads correctly).
- No copy changes.
- No change to chat message bubbles, PDF viewer, or third-party UI components.
