## Goal

After "Create an account" or "Continue with Google" on `/signup`, the user must end up at the paid checkout (Stripe portal) before reaching the app.

## Current state

- `/signup` → "Continue with Google" already triggers OAuth → `/post-auth` → `resolvePostAuthDestination` → `/subscribe` (which calls `/api/checkout` and redirects to Stripe). The pay portal is already wired for Google.
- `/signup` → "Create an account" reveals an inline email + password form. On submit it calls `supabase.auth.signUp` and shows "Check your email" until the user confirms. After confirmation, `/post-auth` routes to `/subscribe` (pay portal).

So the pay portal already exists at `/subscribe` for both flows. What's missing is the explicit confirm-password step and a clearer post-signup hand-off to payment.

## Changes

### 1. `src/routes/signup.tsx` — email signup form

- Add a third field: **Confirm password**.
- Add client-side validation:
  - both passwords must match (show inline error, no submit)
  - min 8 chars (already enforced)
- Change the submit button label from "Create account" to **"Next"**.
- On successful `signUp`:
  - If Supabase returns a session immediately (email confirmation disabled), navigate straight to `/subscribe`.
  - If no session (confirmation required), keep current "Check your email" view but update the copy to: *"Confirm your email to continue to payment."* and link to `/login`.
- Validation messages still only appear after the user opens the inline form and presses Next (existing behavior preserved).

### 2. Google flow

No code change needed — it already lands on `/subscribe` via `/post-auth`. Confirm by walking the path in `resolvePostAuthDestination`.

### 3. Subscribe page (pay portal)

No structural change. It already:
- shows membership summary
- calls `/api/checkout` (Stripe Checkout Session)
- redirects to Stripe-hosted payment

Optional small polish: tighten the heading copy to "Complete your membership" so it reads as the next step after signup. (Confirm with user before changing.)

## Out of scope

- Changing email-confirmation requirement (that's an auth-settings decision; ask if the user wants signup to skip the confirmation email so "Next" goes directly to Stripe).
- Replacing Stripe Checkout with an embedded payment form.

## Open question

Right now Supabase requires email confirmation before a session exists. If the user wants pressing **Next** to go *immediately* to Stripe (no email confirmation step in between), we need to disable "Confirm email" in auth settings. Otherwise the flow is: Next → check email → click link → Stripe.

Which behavior do you want?
- **A.** Keep email confirmation (most secure). Next → "check your email" → after click → Stripe.
- **B.** Disable email confirmation. Next → straight to Stripe.
