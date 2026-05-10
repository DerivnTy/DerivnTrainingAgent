
# End-to-End Signup → Purchase → Access Polish

## Current state (audit)

- `/signup` already shows Google + email (good), but no Apple, and the "Create account" reveal pattern matches spec — keep it, add Apple.
- `/login` has Google + email, no Apple, no Apple parity.
- After signup → goes to `/onboarding` directly. There is **no `/subscribe` page and no subscription gate** — paid users and unpaid users follow the same path. Stripe checkout is only reachable from `/account`. This is the biggest gap.
- `resolvePostAuthDestination` only checks profile completion, not `subscription_status`. Unpaid users land in chat after onboarding.
- `/post-auth` exists and works as router.
- Stripe checkout endpoint (`/api/checkout`) and webhook (`/api/public/stripe-webhook`) already write `subscription_status` to `profiles` — fine to reuse.
- Apple sign-in: project uses Lovable Cloud managed OAuth. Apple is supported via `lovable.auth.signInWithOAuth("apple", …)` and does not need extra Apple Developer setup unless the user wants BYOC branding.

## Target route logic (single source of truth)

Update `src/lib/post-auth-route.ts` so destination is computed as:

```text
no session              → /login
session, no active sub  → /subscribe
sub active, no profile  → /onboarding
sub active, profile ok  → /chat
```

`active` = `profiles.subscription_status === 'active'` AND (`subscription_current_period_end` is null OR in the future). Reuse the existing `has_active_subscription` SQL function via a single `select` of `subscription_status, subscription_current_period_end, profile_completed_at, goal`.

`authenticatedBeforeLoad` enforces the same matrix:
- `/subscribe` allowed only when unsubscribed; redirects active users to onboarding/chat.
- `/onboarding` allowed only when subscribed; sends unsubscribed users to `/subscribe`.
- `/chat` and other app routes require subscribed + profile complete.
- `/account` is always allowed for signed-in users (so they can manage billing even if lapsed).

## Pages

### 1. `/subscribe` (NEW, public-route file `src/routes/subscribe.tsx` — gated in component, not under `_authenticated`, so we can show it cleanly without sidebar)

- Title **AskDerivn Membership**, **$50/month**, "Cancel anytime."
- Value list: chat access, 100-page Built for Motion PDF, saved conversations, personalized context, Derivn-system-guided answers.
- Primary button **Start membership** → POST `/api/checkout` with smooth loading state, double-click guard, surface real error.
- Secondary **Sign out** → `supabase.auth.signOut()` → `/`.
- `beforeLoad`: if no session → `/login`; if already active subscriber → `/post-auth`.
- Stripe success_url stays `/post-auth`; change cancel_url to `/subscribe` (currently `/`).

### 2. `/signup` (edit)

- Add **Continue with Apple** button (`lovable.auth.signInWithOAuth("apple", …)`) above Google, matching pill style.
- Subtitle copy: "Create your AskDerivn account. Membership is $50/month. Cancel anytime."
- Keep the click-to-reveal email form. Change post-email-signup redirect from `/onboarding` to `/post-auth` so the subscription gate applies.
- Remove the "$50/month membership" sidebar list (now lives on `/subscribe`).

### 3. `/login` (edit)

- Add **Continue with Apple** button.
- Existing redirects through `/post-auth` already correct.

### 4. `/post-auth` (edit)

- Use updated resolver. Add a brief calm spinner (small dot/line, ink-soft) instead of plain text.

### 5. `/onboarding` (edit)

- Already works. Keep. Just ensure it can't be reached without an active subscription (handled by `authenticatedBeforeLoad`).

### 6. `/account` (edit)

- "Sign out" already redirects to `/`. Confirm; no behavior change.

## OAuth UX

Lovable managed OAuth uses redirect flow — popup is not supported by the current `lovable.auth.signInWithOAuth` helper. Use the existing redirect through `/post-auth` and rely on the resolver to land users in the right place. Add inline loading state on the OAuth buttons (disable + "Redirecting…") so the click feels responsive.

## Apple sign-in setup

Lovable Cloud ships managed Apple OAuth out of the box — no Apple Developer account is required for it to work. After this pass, Apple should function immediately on `*.lovable.app` and on the custom domain `ask.derivn.com`. If the user ever wants their own brand on Apple's sign-in sheet, they can switch to BYOC in Cloud → Users → Auth Settings → Apple (Team ID + Key ID + Services ID + .p8). I'll call this out in the final summary, not block on it.

## Stripe checkout

- Reuse `/api/checkout`. Update cancel_url to `${origin}/subscribe`.
- Frontend: disable button while pending, single in-flight request, surface server error text in a small inline message (not toast).
- Webhook already updates `subscription_status` and `subscription_current_period_end` — no change.

## Polish

- All buttons use existing `btn-primary` / `btn-secondary` pill styles, cream bg, ink text — consistent with current design tokens.
- Error messages: small `text-red-700` inline below the action that failed.
- Loading: text swap on the button ("Starting…", "Redirecting…", "Saving…"), no global spinners.
- No new design tokens needed.

## Files to change / create

```text
NEW   src/routes/subscribe.tsx
EDIT  src/lib/post-auth-route.ts        (add subscription gate)
EDIT  src/routes/signup.tsx             (Apple button, redirect to /post-auth)
EDIT  src/routes/login.tsx              (Apple button)
EDIT  src/routes/post-auth.tsx          (calmer loading)
EDIT  src/routes/api/checkout.ts        (cancel_url → /subscribe)
```

No DB migration needed — `subscription_status` and `subscription_current_period_end` already exist on `profiles`.

## Verification checklist (manual after implementation)

1. New email user: `/` → Get Access → email signup → `/post-auth` → `/subscribe` → Stripe → `/post-auth` → `/onboarding` → `/chat`.
2. Google user: `/signup` → Google → returns to `/post-auth` → correct destination based on sub + profile state.
3. Apple user: `/signup` → Apple → returns to `/post-auth`. Verify managed Apple works on the preview domain.
4. Returning active+complete user: signs in → `/post-auth` → `/chat` directly.
5. Unsubscribed signed-in user: any app route → `/subscribe`. `/subscribe` for active user → bounces to `/chat` or `/onboarding`.
6. Stripe cancel: returns to `/subscribe`, not `/`.
