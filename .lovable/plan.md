## Goal

After signup, send the user straight to Stripe Checkout instead of the in-app `/subscribe` page.

## Current behavior

1. User signs up → redirected to `/post-auth`
2. `/post-auth` resolves destination → `/subscribe` (since no active subscription)
3. `/subscribe` shows the AskDerivn membership page with a "Start membership" button
4. User clicks button → POST `/api/checkout` → redirected to Stripe

The "another company page" the user is seeing is our own `/subscribe` page.

## Change

Skip the `/subscribe` interstitial. When `resolvePostAuthDestination` returns `/subscribe`, `/post-auth` should call `/api/checkout` and redirect the browser straight to the Stripe Checkout URL.

### Files

**1. `src/routes/post-auth.tsx`**
- After resolving destination: if `dest === "/subscribe"`, call `authedFetch("/api/checkout", { method: "POST" })`, parse `{ url }`, then `window.location.href = url`.
- On checkout error, fall back to navigating to `/subscribe` so the user can retry (and see the error). Update the loading message to "Taking you to checkout…" in that branch.
- Other destinations (`/onboarding`, `/chat`, `/login`) behave as today.

**2. `src/lib/post-auth-route.ts` — `authenticatedBeforeLoad`**
- Currently, any authed user hitting an `/_authenticated/*` route without an active sub is redirected to `/subscribe`. Keep that behavior (so `/subscribe` remains the safety-net page if Stripe fails or the user cancels). No change required here.

**3. `/subscribe` page**
- Keep it. It still acts as the cancel/return target (Stripe `cancel_url` already points there) and the fallback if checkout fails.

## Out of scope
- No Stripe config changes.
- No copy or design changes on `/subscribe`.
- No change to email-verification flow.

## After approval
I will make the edits and verify by signing up with a fresh email in the preview.
