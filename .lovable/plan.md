Add a final call-to-action block at the bottom of the homepage so users have a clear next step after reading the page, without leaving the existing design language.

## Placement

`src/routes/index.tsx` — insert a new `<section>` after "How it works" and before `<SiteFooter />`. It becomes the page's closing CTA.

## Design

- Same `border-t border-rule` divider, `mx-auto max-w-5xl px-6 py-24`, centered.
- Short serif headline: "Ready when you are."
- Two buttons, identical to the hero pair (so the page opens and closes on the same action):
  - Primary ink: `Get Access` → `/signup`
  - Outline: `Sign In` → `/login`
- No new copy block, no extra paragraph, no card.

## Out of scope

- No token, color, or font changes.
- No header changes.
- No new routes or components.
