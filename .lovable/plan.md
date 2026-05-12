# Lock down the Get Access → Stripe flow

## Current flow (already in place)

1. Home/`demo-section` "Get Access" → `/signup`
2. `signup.tsx` calls `supabase.auth.signUp` with `emailRedirectTo = /post-auth`. If a session exists immediately (email confirm off), navigates to `/post-auth`; otherwise shows "check your email".
3. `/post-auth`:
   - waits for the Supabase session
   - calls `resolvePostAuthDestination` (looks at `profiles.subscription_status`)
   - if destination is `/subscribe`, calls `POST /api/checkout` with the user's bearer token and redirects the browser to the Stripe Checkout `url`
   - on return from Stripe with `?checkout=success`, polls `profiles` until `subscription_status = active` before resolving destination again
4. `/api/checkout` validates the bearer token, looks up the profile, reuses or creates a `stripe_customer_id`, then creates a `mode: subscription` Checkout Session with `client_reference_id = userId`, `metadata.supabase_user_id = userId`, and the same metadata on `subscription_data`.
5. `/api/public/stripe-webhook` verifies the Stripe signature, then on `checkout.session.completed` and `customer.subscription.*` updates `profiles.subscription_status`, `subscription_current_period_end`, and `stripe_customer_id` keyed by `metadata.supabase_user_id` (with a `client_reference_id` backfill and a customer-id fallback).
6. `_authenticated.tsx` `beforeLoad` calls `authenticatedBeforeLoad`, which sends any signed-in user without an active subscription to `/subscribe` for every protected route except `/account`. `/subscribe` `beforeLoad` redirects users who already have an active subscription back to `/chat` or `/onboarding`.

So the account is already tied to the Stripe customer + subscription via `stripe_customer_id` on the profile and `supabase_user_id` in Stripe metadata, and unpaid users can't reach `/chat` or `/onboarding`.

## What's still loose

- **Double-charge risk**: `/api/checkout` always creates a brand-new Checkout Session. If a user pays, the webhook is delayed, then they click "Start membership" again (or refresh `/post-auth`), Stripe will happily create a second subscription on the same customer.
- **Rapid double-click**: no idempotency key on session creation, so a quick double-click can create two parallel Checkout Sessions for the same user.
- **No server-side "already subscribed" short-circuit**: the only guard is in the client `beforeLoad`, which trusts the local profile row. If the row hasn't been updated by the webhook yet, the client lets them start a new checkout.

## Changes

### 1. `src/routes/api/checkout.ts` — guard against duplicate subscriptions

Before creating a new Checkout Session:

1. Re-read `profiles` for the authenticated `userId` (already happens). If `subscription_status === "active"` and `subscription_current_period_end` is null or in the future, return `{ alreadyActive: true, redirect: "/post-auth" }` with `200` instead of creating a session.
2. If a `stripe_customer_id` exists, also call `stripe.subscriptions.list({ customer, status: "active", limit: 1 })` and `{ status: "trialing", limit: 1 }`. If either returns a subscription, treat the user as already paid: backfill `profiles` (`subscription_status`, `subscription_current_period_end`, `stripe_customer_id`) using that subscription, then return the same `alreadyActive` response. This catches the "webhook hasn't fired yet" race.
3. When creating the Checkout Session, pass an `idempotencyKey` of `checkout:{userId}:{Math.floor(Date.now() / 60000)}` so duplicate requests within the same minute return the same session instead of a new one.

### 2. `src/routes/post-auth.tsx` — handle the `alreadyActive` response

After `POST /api/checkout`:

- If the JSON body has `alreadyActive: true`, do not redirect to Stripe. Re-run `resolvePostAuthDestination` and `navigate({ to: dest })` (will land on `/onboarding` or `/chat`).
- Keep the existing happy-path behavior (`window.location.href = url`).

### 3. `src/routes/subscribe.tsx` — same handling on the manual button

`onStart` already calls `/api/checkout`. Apply the same `alreadyActive` branch: if returned, `navigate({ to: "/post-auth" })` so the standard resolver places the user correctly. This means even if the `beforeLoad` guard was somehow bypassed, the server still refuses to start a second checkout.

### 4. Sanity passes (no behavior change expected, just verify)

- Confirm `index.tsx` `rootBeforeLoad` already redirects signed-in users away from `/`. It does.
- Confirm `_authenticated.tsx` blocks `/chat` and `/onboarding` for unpaid users. It does (via `authenticatedBeforeLoad`).
- Confirm `signup.tsx` and `login.tsx` both navigate to `/post-auth` so checkout is the only next step. They do.
- Confirm the Stripe webhook keys subscription updates by `supabase_user_id` (primary) with `stripe_customer_id` fallback. It does.

## Out of scope

- No schema changes.
- No change to the webhook handler (it already correctly ties subscriptions back to the user via metadata).
- No change to the `/account` billing portal route.

## Result

After these changes:

- A user who has already paid cannot start a second Checkout Session, even if their local profile row hasn't been refreshed yet — the server checks Stripe directly.
- A rapid double-click produces a single Checkout Session via the idempotency key.
- A user who creates an account and bails before paying still cannot reach `/chat` or `/onboarding` — the existing `_authenticated` guard sends them to `/subscribe` on every visit.
- Every successful payment is tied back to the Supabase user via `client_reference_id` + `metadata.supabase_user_id` on both the session and the subscription, and persisted on `profiles.stripe_customer_id`.
