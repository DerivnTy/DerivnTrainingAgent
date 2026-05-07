## Goal

Polish pass: pill-shaped buttons, smooth Apple-style transitions, soft hover/press/focus states, subtle entrance motion. No layout, copy, or color changes.

## 1. Design tokens (`src/styles.css`)

Add Apple-style easing and entrance motion utilities, plus reusable button classes (so we don't refactor every callsite):

```css
@theme inline {
  --ease-apple: cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes apple-fade-in {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

@layer components {
  .btn-pill {
    @apply inline-flex items-center justify-center gap-2 rounded-full
           h-10 px-5 text-sm font-medium select-none whitespace-nowrap
           transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]
           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40
           active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none;
  }
  .btn-primary {
    @apply btn-pill bg-foreground text-background hover:opacity-90;
  }
  .btn-secondary {
    @apply btn-pill bg-paper text-foreground border border-rule hover:bg-accent;
  }
  .btn-ghost {
    @apply btn-pill text-foreground hover:bg-accent;
  }
  .text-link {
    @apply transition-opacity duration-200 hover:opacity-70;
  }
  .nav-row {
    @apply transition-colors duration-200 hover:bg-accent/60 active:bg-accent;
  }
  .input-soft {
    @apply transition-colors duration-200 outline-none
           focus:border-foreground/60;
  }
  .animate-apple-in { animation: apple-fade-in 320ms var(--ease-apple) both; }
}
```

## 2. Update shared `Button` component (`src/components/ui/button.tsx`)

Rebase variants on the new pill system so any existing `<Button>` instance becomes Apple-style automatically:

- Base: `rounded-full transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring/40`
- `default` → `bg-foreground text-background hover:opacity-90` (no shadow)
- `secondary` → `bg-paper border border-rule hover:bg-accent`
- `outline` → `border border-rule bg-transparent hover:bg-accent`
- `ghost` → `hover:bg-accent`
- `link` → `text-foreground hover:opacity-70 underline-offset-4`
- Sizes: `sm h-8 px-4`, `default h-10 px-5`, `lg h-12 px-7`, `icon h-10 w-10 rounded-full`

## 3. Apply across pages (light touch)

For each file below, swap inline button classNames to `btn-primary` / `btn-secondary` / `btn-ghost`, and add `text-link` on inline links. No structural changes.

- `src/routes/index.tsx` (landing CTAs + nav)
- `src/routes/login.tsx`, `src/routes/signup.tsx` (Email/Google buttons, links)
- `src/routes/_authenticated.onboarding.tsx` (chips → pill `btn-secondary`, submit → `btn-primary`)
- `src/routes/_authenticated.account.tsx` (Manage billing, Sign out)
- `src/routes/_authenticated.resource.tsx` (PDF buttons)
- `src/routes/_authenticated.chat.tsx`:
  - Starter cards: keep current 2-card layout but add `transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98]`
  - Send button: already circular pill — add the same transition + active scale
  - Input wrapper: add `focus-within:bg-accent` smooth transition
  - Wrap message render in `animate-apple-in` so new bubbles fade/slide in gently
- `src/components/app-sidebar.tsx` (conversation rows → `nav-row`, "New chat" → `btn-secondary` or pill ghost)
- `src/routes/_authenticated.tsx` (mobile menu icon button → ghost pill)
- `src/components/add-to-home-screen-banner.tsx` (dismiss/install → pill)

## 4. Page entrance motion

In `src/routes/__root.tsx`, wrap the `<Outlet />` content area with `className="animate-apple-in"` keyed on pathname so route changes get a 320ms fade-up. (Use `key={location.pathname}` on the wrapper.)

## 5. Form inputs

Add `input-soft` to text inputs in login, signup, onboarding, and chat input. Removes harsh focus ring, smooth border darkening only.

## Out of scope

- No new colors, gradients, or shadows.
- No layout changes, no new sections, no copy edits.
- No new dependencies (no Framer Motion).
- Functionality, routing, and auth flow untouched.

## Technical notes

- Tailwind v4 `@layer components` + `@apply` is supported in this project (`src/styles.css` already uses `@theme inline`).
- Active-state scale uses `active:scale-[0.98]` — works on touch via `:active`.
- Focus ring uses `ring/40` to stay quiet but accessible.
- All durations 150–250ms for interactions, 320ms for entrance — matches the spec.
