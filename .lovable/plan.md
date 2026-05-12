# Customer Flow Audit

Goal: walk every customer-facing path end-to-end, fix anything that misroutes or confuses a paying user. I'll test in the browser after fixes, not just read code.

## Flows to verify

1. **Landing (`/`)** → header "Sign In" / "Get Access", hero CTAs, pricing card "Get Access", demo 2-question limit, final CTA section, footer.
2. **Signup** → email/password → email verification → `/post-auth` → `/subscribe` → Stripe Checkout → return to `/post-auth` → `/onboarding` → `/chat`.
3. **Login** → existing user → `/post-auth` → correct destination based on subscription + onboarding state.
4. **Forgot password** → email link → `/reset-password` → set new password → `/post-auth` → correct destination.
5. **Chat** → starters, send, new conversation creation, switch conversations, rename, delete, sub-expired error, profile-incomplete error, sign-out kicks to `/login`.
6. **Account** → change email, send password reset, open Stripe billing portal, edit profile context, sign out.
7. **Subscribe page** → start membership, Stripe cancel returns to `/subscribe`, sign out works.
8. **PDF** → sidebar "Download PDF" opens viewer, viewer download button works.
9. **Add-to-Home-Screen modal** → "Got it" closes, "Don't tell me again" persists.

## Issues found in static review (will fix)

1. **`/account` is broken for legacy Google/Apple users.** The page reads `user.app_metadata.provider`; if it's not `"email"` it hides the change-email and reset-password forms. Since OAuth is gone, those users now have no way to manage their account from the UI. Fix: always show both forms regardless of provider, and remove the "Sign-in method" row (or just show "Email").

2. **Stripe success → race condition.** Checkout `success_url` is `/post-auth`, which checks `subscription_status` from `profiles`. The Stripe webhook updates that asynchronously, so the user can land on `/post-auth` and bounce back to `/subscribe` if the webhook hasn't fired yet. Fix: in `/post-auth`, when arriving from a checkout return, poll `profiles.subscription_status` for ~5–8 seconds before deciding the destination.

3. **`/resource` page is orphaned.** Sidebar uses the in-app PDF viewer dialog and never links to `/resource`. Either link it or delete the route. Recommend deleting it (the dialog already covers the use case).

4. **A2HS modal shows on desktop.** It blocks the chat with iPhone/Android instructions on a 1200px viewport, which is confusing. Fix: only show on touch devices / small viewports.

5. **`/subscribe` has two "Sign out" buttons.** Header link + bottom button. Keep only the header one.

6. **Cosmetic:** `/account` "Renews / ends" doesn't say which it is. Fix: label by `subscription_status` (`Renews on …` if active, `Ends on …` if cancelled).

## Test method

After the fixes I'll drive the browser through flows 1, 2 (up to Stripe redirect), 3, 4, 5, 6, 7, 8, 9 against the preview. I won't complete a real Stripe purchase — I'll verify the redirect to Stripe Checkout succeeds and stop there, then verify the cancel-return path manually. For flow 4 (password reset) I'll verify the request side; the email link itself can't be clicked from the sandbox.

## What I won't change

- Stripe webhook logic, RLS policies, API endpoints, AI/chat backend — the request is about consumer flow, not backend rewrites.
- Visual design — only the broken/confusing bits above.

Sound good? Hit Implement and I'll execute the fixes and the browser walkthrough.
