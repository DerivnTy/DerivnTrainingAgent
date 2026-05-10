## Problem

In `AuthShell` (used by `/login` and `/signup`), the content wrapper is `<div className="mt-10 space-y-6">{children}</div>`. `space-y-6` applies a 24px gap between **every** direct child — so the Google button, Apple button, "Create an account" button, divider, and form all sit 24px apart. That's why the auth buttons feel like they're floating in their own zones instead of reading as one cohesive group.

Apple/Stripe/Uber/DoorDash auth stacks use a tight 8–10px gap *between buttons in the same group*, and only widen spacing *between groups* (e.g. before/after a divider). Buttons in the same group should look like a single unit.

## Fix

### 1. `src/routes/login.tsx` — `AuthShell`
- Change wrapper from `mt-10 space-y-6` to `mt-10` (no automatic space-between). Spacing becomes the responsibility of each child group, matching Apple's approach.

### 2. `src/routes/login.tsx` — `LoginPage` body
Wrap the OAuth buttons in a tight stack and add explicit spacing between groups:
- OAuth group: `<div className="space-y-2">` containing Google + Apple buttons (drop the `mt-2` on the Apple button — handled by parent).
- Divider: add `mt-6` (24px between OAuth group and divider).
- Form: add `mt-6` (24px after divider).
- "New here?" footer line: keep `mt-8` (already correct — section break).
- Bottom "No starting over" section: keep `mt-12 … pt-8` (already correct — major section break).

### 3. `src/routes/signup.tsx` — `SignupPage` body
Same treatment, accounting for the toggle to email form:
- OAuth group: `<div className="space-y-2">` for Google + Apple (drop `mt-2` on Apple).
- "Create an account" button (toggle): `mt-3` from the OAuth group — it's a related-but-distinct action (10–12px).
- When email form is shown: divider gets `mt-6`, form gets `mt-6` after divider.
- "Already have an account?" line: keep `mt-8`.
- "What you get with AskDerivn" section: keep `mt-12 border-t … pt-8`.

### 4. Sent-confirmation `AuthShell` (signup success state)
No change needed — only one child, spacing already correct.

## Spacing rhythm (site-wide for auth stacks)

| Relationship | Gap |
|---|---|
| Buttons within same OAuth group | 8px (`space-y-2`) |
| OAuth group → adjacent action button (e.g. "Create an account") | 12px (`mt-3`) |
| Group → divider, divider → next group | 24px (`mt-6`) |
| Form internal fields | 16px (`space-y-4`, already in place) |
| Section break (footer link, secondary copy) | 32px (`mt-8`) |
| Major section (bottom marketing block) | 48px + top border (`mt-12 pt-8`, already in place) |

This is the only place in the codebase that uses this pattern (the `/subscribe` page uses `space-y-3` already, which is tight and fine; chat/onboarding use form/list patterns, not stacked CTAs). So the change is scoped to `AuthShell` + the two auth route bodies — no other files need updating.

## Out of scope
- No button height/padding changes (already `h-10`, Apple-equivalent).
- No copy changes.
- No color/border changes.
- No changes to `/subscribe`, chat, onboarding, or homepage.
