## Confirming current routing

Yes — the funnel is working as designed:

- No session → `/login`
- Logged in, no active subscription → `/subscribe`
- Active sub, onboarding incomplete → `/onboarding`
- Active sub, onboarding complete → `/chat`

If you're previewing without a paid subscription, the hard paywall blocks `/chat`. That's the gate doing its job, not a bug.

## Plan: preview-only dev bypass

Add a narrow allowlist that treats any logged-in user with an `@derivn.com` email as having an active subscription — but only in preview/dev, never in production. Onboarding is NOT bypassed (you'll still complete it once per test account, as requested).

### Where the bypass applies

Two checkpoints, both must agree:

1. **Frontend funnel** — `src/lib/post-auth-route.ts` `resolvePostAuthDestination()`: if bypass user, treat subscription as active and route based on profile completion only.
2. **Backend chat API guard** — `src/server/auth.server.ts` `requireActiveSubscription()`: if bypass user, skip the 402 paywall check and return a synthetic active profile.

### Bypass condition (single helper)

New file `src/lib/dev-bypass.ts` exporting `isDevBypassEmail(email)`:

```ts
export function isDevBypassEmail(email?: string | null): boolean {
  if (!email) return false;
  if (!email.toLowerCase().endsWith("@derivn.com")) return false;
  // Preview/dev only — never on the published production domain.
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const isProd = host === "ask.derivn.com" || host === "derivn-ai-buddy.lovable.app";
    if (isProd) return false;
  } else {
    // Server: block on production hostnames via request header check at call site.
    // The server-side guard reads the Host header and applies the same rule.
  }
  return true;
}
```

Server-side equivalent uses the incoming `Request` Host header (passed in) — same allowlist, same prod-host blocklist.

### Frontend changes

- `resolvePostAuthDestination(userId)` — also fetch the session email; if `isDevBypassEmail(email)`, skip the subscription check and return `/onboarding` or `/chat` based on `profile_completed_at`/`goal`.
- `authenticatedBeforeLoad` — unchanged (it just consumes the resolver).

### Backend changes

- `requireActiveSubscription` — new signature accepts `(userId, email, request)`. If `isDevBypassEmail(email)` and host is non-prod, fetch the profile but don't enforce status; return it as-is so the downstream `requireCompleteProfile` still runs.
- `src/routes/api/chat.ts` — pass `authedUser.email` and `request` into `requireActiveSubscription`.

### Visible "DEV ACCESS" indicator

Small fixed pill in the bottom-right corner of authenticated routes when `isDevBypassEmail(session.user.email)` is true:

- Component: `src/components/dev-access-badge.tsx`
- Mounted in `src/routes/_authenticated.tsx`
- Plain text "DEV ACCESS", muted background, no icon, dismissible via close button (session-only)

### Out of scope

- No DB changes
- No new secrets
- No changes to Stripe webhook, onboarding, or chat logic
- No bypass of onboarding (you'll complete it once per test account)
- No changes to landing, login, or public routes

### Files to edit

- create `src/lib/dev-bypass.ts`
- create `src/components/dev-access-badge.tsx`
- edit `src/lib/post-auth-route.ts`
- edit `src/server/auth.server.ts`
- edit `src/routes/api/chat.ts`
- edit `src/routes/_authenticated.tsx`

### Acceptance

1. Sign up in preview with a `@derivn.com` email → land on `/onboarding` (not `/subscribe`).
2. Complete onboarding → land on `/chat`, send message, get assistant response.
3. "DEV ACCESS" pill is visible in preview but absent in production.
4. A non-`@derivn.com` user in preview still hits the paywall.
5. A `@derivn.com` user on the production domain (`ask.derivn.com`) still hits the paywall — bypass is host-gated.

### Removal before launch

Single grep for `dev-bypass` removes the entire mechanism. I'll add a `// TODO: remove before public launch` marker in each file.
