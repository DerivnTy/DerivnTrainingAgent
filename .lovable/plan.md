## Add value section to Get access (signup) and welcome-back to Sign in

Both auth pages currently show only a form on a mostly empty page. Add a small content block under the form area to make them feel substantive, on-brand, and warm — without changing the design language or auth flow.

### Signup page (`/signup`) — "what you're getting"

Below the form (inside `AuthShell`'s main column, after the bottom "Already have an account?" link), add a quiet bordered section titled "What you get with AskDerivn" with a short list of 3–4 membership benefits. Examples:
- Private, judgment-free chat trained for your goals
- Honest, direct guidance — no fluff
- Unlimited conversations, $50/month
- Cancel anytime

Style: cream/ink palette, `border-rule` divider on top, mono uppercase eyebrow label, serif sub-heading, small ink-soft body text. No icons or marketing graphics — keep it editorial.

### Login page (`/login`) — "welcome back"

Replace the current plain "Welcome back to AskDerivn." subtitle with a slightly warmer headline treatment, and add a small block below the form:
- A short personal welcome line ("Pick up where you left off.")
- 2–3 bullets reminding them what's waiting (their saved conversations, their goal context, no re-onboarding)

Same visual treatment as the signup block for consistency.

### Files to change

- `src/routes/signup.tsx` — add a `<MembershipPerks />` section below the existing footer link inside the page body.
- `src/routes/login.tsx` — soften the subtitle, add a `<WelcomeBackNote />` section below the existing footer link.
- Optionally extract both blocks into a tiny shared component in the same file or a new `src/components/auth-aside.tsx` if reused.

### Out of scope

- No changes to auth flow, OAuth, or routing.
- No new images, illustrations, or icons.
- No copy beyond the small benefit/welcome blocks.

### Open question

Do you want the benefits block placed **below the form on the same column** (mobile-friendly, scroll down to see it), or as a **side panel to the right** on desktop (two-column layout on wide screens, stacked on mobile)?