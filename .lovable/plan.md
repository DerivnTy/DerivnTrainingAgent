# Admin Area Plan

Confirmed: `hello@derivn.com` exists as a real auth user (id `0e2a0395-e6df-46d8-97c1-5a77b57e38e8`). I'll seed this user as the first admin.

## 1. Database (migration)

Create `public.admin_users`:
- `user_id uuid primary key` (the auth user id)
- `email text not null`
- `created_at timestamptz not null default now()`

RLS: enabled, with **no policies** for normal users. All admin reads happen via the service-role server (admin client), so the table stays inaccessible from the browser.

Security-definer helper:
```sql
create or replace function public.is_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists (select 1 from public.admin_users where user_id = _user_id)
$$;
```

Seed row: insert `(0e2a0395-…, 'hello@derivn.com')`.

## 2. Server functions (server-side admin verification)

New file `src/lib/admin.functions.ts` (thin file, only `createServerFn` declarations) using `requireSupabaseAuth` + `supabaseAdmin`:

- `getAdminSummary` — verifies caller is admin via `is_admin(auth.uid())`; if not, throws 403. Returns:
  - total signed-up users (count of `profiles`)
  - total memberships (profiles with any non-null `subscription_status` other than `inactive`, OR all profiles depending on definition — I'll use "users with a Stripe customer id" for memberships and "subscription_status='active' AND not expired" for active)
  - total active subscribers
  - total canceled/inactive subscribers
  - 5 most recent signups (email, created_at)

- `getAdminUsers` — same admin gate. Returns array of profile rows with: `id`, `email`, `display_name`, `subscription_status`, `subscription_current_period_end`, `created_at`, `profile_completed_at`, `stripe_customer_id`. Uses `supabaseAdmin` so RLS is bypassed cleanly server-side. Optional pagination params (limit/offset) — V1 returns up to 200 newest.

Both functions:
1. `requireSupabaseAuth` ⇒ confirms auth.
2. Call `is_admin(userId)` via admin client ⇒ confirms admin server-side.
3. Only then return data.

(No /api/* HTTP routes needed — `createServerFn` is the right TanStack pattern. The spec's "/api/admin/*" intent is satisfied by these protected RPCs.)

## 3. Routing

Update `src/lib/post-auth-route.ts`:
- Add `"/admin"` to `PostAuthDestination`.
- New `resolvePostAuthDestination` first checks `is_admin` (via a small server fn `checkIsAdmin`) — if admin, returns `/admin`. Otherwise existing logic.
- `authenticatedBeforeLoad` allows `/admin` only for admins; non-admins hitting `/admin` are redirected to their normal destination (chat/onboarding/subscribe).

New route `src/routes/_authenticated.admin.tsx`:
- `beforeLoad` calls `checkIsAdmin`; if false → `redirect({ to: '/chat' })`.
- Loader calls `getAdminSummary` + `getAdminUsers` in parallel.
- Component renders the page.

`post-auth.tsx` already routes via `resolvePostAuthDestination`, so admins land on `/admin` after sign-in automatically.

## 4. Admin page UI (`/admin`)

AskDerivn style: cream bg, ink text, thin `border-rule` dividers, mono `.t-eyebrow` labels, `.t-h1` / `.t-h3`, no charts/gradients.

Layout:
- Header: `.t-eyebrow` "Admin" + `.t-h1` "Members".
- Stats strip (4 stat blocks, divided by thin rules):
  - Total signups
  - Total memberships
  - Active subscribers
  - Canceled / inactive
- Section: "Recent signups" — small list (email + relative date), 5 rows.
- Section: "All members" — simple table:
  - Name (display_name) | Email | Status | Signed up | Sub started* | Period ends | Profile complete
  - *Sub start: we don't track it explicitly today; show `—` (note in plan: future field). Period end uses `subscription_current_period_end`.

No admin link is shown in the regular sidebar for non-admins. For admins, add a small "Admin" link in `AppSidebar` rendered only when `checkIsAdmin` returns true (cosmetic — actual gating is server-side).

## 5. Security checklist

- Service role key only in `client.server.ts` (already the case); never imported by components.
- Admin-only data only returned after server-side `is_admin` check.
- `admin_users` table has RLS enabled with no policies → unreadable from browser.
- No "become admin" UI; admins added by direct DB insert.
- Non-admin visiting `/admin` is server-redirected via `beforeLoad` AND server fn 403s as a second layer.

## 6. Files touched

- migration (new table + `is_admin` fn + seed insert)
- `src/lib/admin.functions.ts` (new)
- `src/lib/post-auth-route.ts` (admin branch)
- `src/routes/_authenticated.admin.tsx` (new)
- `src/components/app-sidebar.tsx` (conditional Admin link)

## Out of scope (V1)

- Charts / analytics
- Editing users from admin UI
- Pagination beyond 200 rows
- Sub start date column (not tracked today)

Ready to implement on approval.
