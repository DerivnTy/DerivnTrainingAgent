## Heads up on the email

You wrote `hello@derivan.com`, but the admin row in the database is `hello@derivn.com` (no "a"). The auth account also exists under `hello@derivn.com`. Sign in with **hello@derivn.com** — that's the approved admin.

## Why it's not redirecting today

The post-sign-in router calls a server function (`checkIsAdmin`) that's protected by the Supabase auth middleware. That middleware requires an `Authorization: Bearer <token>` header on the request. In this app, server functions are called directly from the browser with no global fetch interceptor that attaches the user's access token, so `checkIsAdmin` is returning **401 Unauthorized**, the helper swallows the error and returns `isAdmin: false`, and the router falls through to the normal subscribe / chat flow.

The actual `admin_users` row is correct — the lookup just never reaches it.

## Fix

Move the admin check to the browser Supabase client (which already carries the user's session) and let RLS gate it.

1. **Migration: allow a user to read their own `admin_users` row.**
   - Enable RLS on `public.admin_users`.
   - Add SELECT policy: `auth.uid() = user_id`.
   - No INSERT/UPDATE/DELETE policies — only the service role (server) can write, which is what we want.

2. **`src/lib/post-auth-route.ts` — replace `isCurrentUserAdmin()`** so it queries directly:
   ```ts
   const { data } = await supabase
     .from("admin_users")
     .select("user_id")
     .eq("user_id", userId)
     .maybeSingle();
   return Boolean(data);
   ```
   Pass `userId` in (we already have it in `resolvePostAuthDestination` and `authenticatedBeforeLoad`).

3. **`src/components/app-sidebar.tsx`** — replace the `checkIsAdmin()` server-fn call with the same direct query, scoped to the current session user, so the "Admin" sidebar link appears for the admin without depending on the server fn.

4. **Leave the server functions alone.** `getAdminSummary` and `getAdminUsers` still run server-side with `requireSupabaseAuth` + `is_admin()` RPC, so the actual admin data stays protected. Only the *routing decision* moves to the client (which is fine — the `/admin` page itself is still server-protected).

## Acceptance

- Sign in with `hello@derivn.com` → land on `/admin`.
- Other accounts → unchanged flow (subscribe / onboarding / chat).
- Typing `/admin` as a non-admin still redirects away.
- Admin sidebar link appears only for the admin.

No changes to signup, subscription, onboarding, or chat behavior.
