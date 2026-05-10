## Goal

Split the homepage's combined "What you get + price" block into two separate sections, each with its own `border-t border-rule` divider, so the page rhythm matches the rest of the site.

## Final homepage order

1. Hero
2. What you get
3. Pricing
4. How it works (`DemoSection`)
5. "Ready when you are." CTA
6. Footer

(No changes to hero, DemoSection, final CTA, or footer.)

## Changes — `src/routes/index.tsx`

Replace the current combined section (the `<section className="border-t border-rule">` containing "What you get" + price + CTA) with **two** sibling sections.

### Section A — What you get

- `border-t border-rule`, same `max-w-5xl` container, same vertical padding (`py-20`).
- Centered heading "What you get" (serif, same sizes as today).
- Short subtitle: "Two things, one membership."  *(replaces the current $30 subtitle so price lives only in the Pricing section)*
- Two-column grid on desktop (`md:grid-cols-2`), single column on mobile — same `01 / 02` numbered items already in place:
  - 01 Built for Motion PDF — existing copy.
  - 02 AskDerivn chat — existing copy.
- Closing line, centered, muted: "The PDF gives you the system. AskDerivn helps you apply it."
- **No** price, **no** CTA in this section.

### Section B — Pricing (new section)

- New `<section className="border-t border-rule">` immediately after Section A.
- Same `max-w-5xl` container, same `py-20` padding, centered content, cream background (inherits from `bg-background`).
- Content stack (centered, `max-w-2xl mx-auto`):
  - Small label: "Pricing" (serif, same scale as other section titles — `text-4xl md:text-5xl`).
  - Price: `$30/month` (serif, large — `text-5xl`).
  - Muted line: "Cancel anytime."
  - "Get Access" pill button → `<Link to="/signup">`, same styling as other primary buttons (`h-12 px-7`, full pill, `bg-foreground text-background`). Large/easy-tap on mobile.
  - Optional small line below button, muted: "Includes the 100-page PDF and AskDerivn chat access."
- No bullet list, no cards, no gradients.

## Out of scope

- No changes to `/subscribe`, `/signup`, auth flow, Stripe, or pricing logic.
- No changes to design tokens or `styles.css`.
- No copy changes elsewhere on the page.
