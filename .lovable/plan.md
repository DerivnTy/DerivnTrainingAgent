# Remove OAuth and Developer Admin Access

Goal: Email + password is the only way in. The hidden `/admin` page and the `@derivn.com` dev bypass are removed. Stripe remains the source of truth for paying customers.

## 1. Remove Google / Apple sign-in

- `src/routes/login.tsx`
  - Delete the two OAuth buttons, the `onOAuth` handler, the `oauthLoading` state, and the `lovable` import.
  - Delete the `Divider` between OAuth and the email form (email form becomes the only path).
  - Keep the `auth_error` sessionStorage read so any leftover messages still surface (harmless going forward).
- `src/routes/signup.tsx`
  - Delete the two OAuth buttons, `onOAuth`, `oauthLoading`, the "Create an account" toggle, and the `showEmailForm` state. Show the email/password form directly.
  - Remove the `lovable` import.
- `src/routes/post-auth.tsx`
  - Delete the OAuth-intent guard block (the `oauth_intent` sessionStorage check and the brand-new-user signout). No longer needed since OAuth is gone.
- Disable the providers in Lovable Cloud auth settings via `configure_social_auth` with `disable_providers: ["google", "apple"]` so the backend rejects any stale OAuth attempts.

Note: `src/integrations/lovable/index.ts` is auto-generated — leave it alone.

## 2. Remove the developer admin backend

- Delete `src/routes/_authenticated.admin.tsx` (the admin dashboard page).
- Delete `src/lib/admin.functions.ts` (the `getAdminSummary` / `getAdminUsers` server functions).
- Delete `src/components/dev-access-badge.tsx` and remove its usage from wherever it's mounted (likely `src/routes/_authenticated.tsx` or `__root.tsx`).
- Delete `src/lib/dev-bypass.ts`.
- `src/server/auth.server.ts`: remove the `isDevBypassEmailServer` import and the dev-bypass branch in `requireActiveSubscription` so subscription status is enforced for everyone, including `@derivn.com` accounts. Stripe webhooks remain the only thing that flips `subscription_status` to `active`.
- Search for any remaining `dev-bypass`, `DevAccessBadge`, or `/admin` references and clean them up.

## 3. What is NOT changing

- Email/password auth, password reset, and the Stripe checkout / webhook flow are untouched.
- The `profiles` table and subscription columns stay — Stripe continues to drive `subscription_status`.
- No database migration is required (we're just removing code paths, not schema).

## Customer impact callout

Anyone who previously signed up with Google or Apple will no longer be able to log in, because they have no password on file. After this ships, those users would need to use "Forgot password" to set one (their email is already on the account). Want me to add a short note about that on the login page, or leave the messaging as-is?
