## Auth + Profile + Hard Paywall ($50/mo Stripe BYOK)

### 1. Database (single migration)

**`profiles` table** (1 row per user, auto-created on signup)
- `id` uuid PK = `auth.users.id`
- `email` text
- `display_name` text
- `goal` text, `training_level` text, `weekly_schedule` text, `equipment` text, `limitations` text
- `stripe_customer_id` text
- `subscription_status` text default `'inactive'` (`'active' | 'inactive' | 'canceled' | 'past_due'`)
- `subscription_current_period_end` timestamptz
- `created_at`, `updated_at`

**RLS**: user can `select`/`update` own row only. Inserts handled by trigger.

**Trigger** `handle_new_user()` on `auth.users` insert → creates profile row with email + display_name from metadata.

**Helper function** `public.has_active_subscription(uuid)` (SECURITY DEFINER) → boolean. Used later for chat/PDF gating.

### 2. Auth (Google + Email)

- Call `configure_social_auth` with `providers: ["google"]` (keep email enabled).
- Email signup keeps default email confirmation (no auto-confirm).
- Use Lovable managed Google OAuth via `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/post-auth" })`.

### 3. Routes

```
/                    landing (existing)
/login               email + Google sign-in
/signup              email + Google sign-up
/post-auth           transient: checks subscription → /chat or /subscribe
/_authenticated      layout guard (redirects to /login)
  /subscribe         paywall page; "Subscribe $50/mo" → Stripe Checkout
  /onboarding        edit profile fields (goal, level, schedule, equipment, limitations)
  /chat              gated by active subscription (placeholder for now; chat UI in next step)
  /account           manage subscription (Customer Portal link), sign out
```

`_authenticated` checks session. Inside it, a second wrapper component checks `subscription_status` — if not `active`, redirect to `/subscribe`. `/subscribe` itself lives under `_authenticated` but is exempt from the subscription check.

### 4. Stripe (BYOK — uses existing `STRIPE_SECRET_KEY` + `STRIPE_PRICE_ID`)

Three TanStack server functions (in `src/server/`):

- **`createCheckoutSession.functions.ts`** (`requireSupabaseAuth`):
  - Read/create `stripe_customer_id` on profile.
  - Create Stripe Checkout Session, mode `subscription`, `price = STRIPE_PRICE_ID`, success_url `/post-auth`, cancel_url `/subscribe`.
  - Return `url`.

- **`createPortalSession.functions.ts`** (`requireSupabaseAuth`):
  - Create Stripe Billing Portal session for `stripe_customer_id`. Return `url`.

- **`getSubscriptionStatus.functions.ts`** (`requireSupabaseAuth`):
  - Returns `{ status, current_period_end }` from profile (used by guard + UI).

**Webhook** (server route): `src/routes/api/public/stripe-webhook.ts`
- Verify `stripe-signature` with `STRIPE_WEBHOOK_SECRET` (will request as a new secret).
- Handle `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted` → update `subscription_status` + `subscription_current_period_end` on profile via `supabaseAdmin`.

### 5. Secrets to request

- `STRIPE_WEBHOOK_SECRET` (whsec_...) — needed to verify webhook events. User creates webhook in Stripe dashboard pointing to `https://project--359bad84-2ee0-4ae8-a5c7-b4972de99b1c.lovable.app/api/public/stripe-webhook` after deploy.

`STRIPE_SECRET_KEY` and `STRIPE_PRICE_ID` already present.

### 6. UI

- **Landing**: wire `Get Access` → `/signup`, `Sign In` → `/login`.
- **Login/Signup**: clean, minimal forms matching cream/ink design. Google button + email/password. No cards — same flat aesthetic as landing.
- **Subscribe page**: headline, $50/month, bullet list of what's included (AskDerivn assistant, Built for Motion PDF, saved conversations, profile context, Derivn-system answers), "Subscribe — $50/month" button, "Sign out" link.
- **Onboarding**: simple form, can be skipped/edited later.
- **Account**: "Manage billing" → Customer Portal, "Sign out".
- **Chat**: placeholder page with header that confirms gating works (real chat UI in a later step).

### 7. Flow summary

```
Visitor → /signup (email or Google)
  → email confirms → /login → submit
  → /post-auth
     ├─ no active sub → /subscribe → Stripe Checkout
     │     → webhook flips subscription_status=active
     │     → success_url /post-auth → /chat
     └─ active sub → /chat
```

### Out of scope for this step
- Chat UI / OpenAI assistant wiring (next step).
- PDF download protection (will reuse `has_active_subscription`).
- Free trial.
