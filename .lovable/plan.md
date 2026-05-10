
## What the customer hit

On `/chat`, after a brief delay, the "Add to home screen" pop-up appears (`src/components/add-to-home-screen-banner.tsx`). Clicking **Got it** should just close the pop-up. Instead, the customer was kicked to the homepage.

Reading the code, the most likely cause is a combination of two small things in that file:

1. The **Got it** button has no `type="button"`. On iOS Safari, a `<button>` without an explicit type defaults to `submit`, and if any wrapping context treats it as a form submit, the page can navigate. The chat page also has a `<form>` for the message input — if the banner is ever re-parented during a Sheet/Dialog transition, a stray submit can land on the chat form and trigger a navigation.
2. The full-screen overlay `<div className="fixed inset-0 ...">` has no `role="dialog"`, no focus trap, and no click-outside guard. On a mistap the customer could close the banner *and* hit a Link underneath (e.g. the sidebar wordmark in the open mobile sheet) in the same gesture.

Either way, the right fix is to make the banner a real, contained dialog and make every button explicit.

While I'm in there, I'll do the full button/flow audit you asked for and tighten anything that looks brittle.

## Plan

### 1. Fix the "Got it" pop-up (root cause)

File: `src/components/add-to-home-screen-banner.tsx`

- Add `type="button"` to the **Got it** button.
- Add `role="dialog"` and `aria-modal="true"` to the overlay; stop click propagation on the inner card so clicks never leak through.
- Guard the backdrop: clicking outside the card does nothing (does not close, does not navigate).
- Lock body scroll while open, restore on close.
- Keep the existing "Don't tell me again" + dismissal logic untouched.

### 2. Audit every button/link, page by page

For each page below I'll verify: (a) every `<button>` that isn't a real submit has `type="button"`, (b) every navigation goes where the copy promises, (c) error/loading states don't strand the user, (d) sign-out always lands somewhere sensible.

Pages to walk through:

- **Landing** (`src/routes/index.tsx`): header Sign In / Get Access, hero CTAs, pricing CTA, bottom CTAs, footer.
- **Demo section** (`src/components/demo-section.tsx`): suggestion chips, Ask button, post-limit Get Access / Sign In.
- **Login / Signup** (`src/routes/login.tsx`, `src/routes/signup.tsx`): Google, Apple, Create an account, Next, Forgot password, cross-links.
- **Forgot / Reset password** (`src/routes/forgot-password.tsx`, `src/routes/reset-password.tsx`): submit, "try again", expired-link link.
- **Subscribe** (`src/routes/subscribe.tsx`): Start membership, Sign out, wordmark.
- **Post-auth** (`src/routes/post-auth.tsx`): silent gate, but verify it never loops.
- **Onboarding** (`src/routes/_authenticated.onboarding.tsx`): chip buttons (already `type="button"` ✓), Save and continue, navigation on success.
- **Chat** (`src/routes/_authenticated.chat.tsx`): starter buttons, Send, redirect-on-error paths (401 → /login, 428 → /onboarding, 402 → inline message).
- **Account** (`src/routes/_authenticated.account.tsx`): Send confirmation, Send password reset email, Manage billing, Sign out, chip buttons, Save changes, Redo onboarding, Back to chat. Confirm `Send confirmation` button gets `type="submit"` only because it's the form's primary action (it is — fine), and verify nothing else can submit the form accidentally.
- **Resource** (`src/routes/_authenticated.resource.tsx`): Download / Open in browser anchors.
- **Admin** (`src/routes/_authenticated.admin.tsx`): no interactive controls beyond loading — verify.
- **Sidebar** (`src/components/app-sidebar.tsx`): + New chat, conversation links, Rename, Delete, Download PDF (opens dialog), Account, Admin (admins only), Sign out.
- **Auth guard wrapper** (`src/routes/_authenticated.tsx`): mobile menu button, sheet open/close.
- **PDF dialog** (`src/components/pdf-viewer-dialog.tsx`): Download, Close.
- **Dev access badge** (`src/components/dev-access-badge.tsx`): dismiss.

### 3. Defensive cleanups likely to come out of the audit

These are the ones I expect to fix; I'll only touch what's actually broken:

- Add `type="button"` to any `<button>` inside or adjacent to a `<form>` that doesn't already have it (sweep all files above).
- Replace `window.prompt` / `window.confirm` in the sidebar's **Rename** and **Delete** with a small in-app modal (these are jarring on mobile and look unprofessional next to the rest of the UI). Same flow, no behavior change beyond the prompt UI.
- `signOut` in sidebar / account / subscribe currently uses `window.location.href = "/"`. That's fine, but I'll make sure the auth guard's `onAuthStateChange` doesn't double-fire a `/login` redirect first.
- Verify the chat page error handlers use `navigate({ to: ... })` instead of `window.location.href` where a soft nav is enough, so subscription/onboarding state isn't lost.

### 4. Manual verification

Once the changes are in, I'll open the preview as a logged-in user, walk the flows, and confirm:

- Got it on the chat banner → banner closes, URL stays on `/chat`.
- Sign out from chat → lands on `/`.
- Subscribe page → Start membership opens Stripe (or surfaces a clean error).
- Forgot password → email link → reset → auto-redirect to `/post-auth`.
- Onboarding submit → `/chat`.
- Admin link visible only for `hello@derivn.com`; clicking it lands on `/admin`.
- Rename/Delete a conversation works from the new in-app modal.

## Out of scope

- No backend / RLS / migration changes.
- No copy or visual redesign beyond the banner fix and the in-app rename/delete modal.
- No subscription/Stripe logic changes.
