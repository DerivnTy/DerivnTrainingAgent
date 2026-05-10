## Goal

Change all visible pricing from `$50/month` to `$30/month` and add a clean, minimal Membership block on the homepage. Keep the text-only V1 positioning — no mentions of image, voice, audio, or video features, and no token-limit copy.

## Files to update

### 1. `src/routes/index.tsx` — Add minimal Membership block
Inside the existing "What you get" section, append a small block directly under the two-column grid (above the closing `<p>` "The PDF gives you the system…" line, or right after it — whichever reads best). Keep cream background, ink text, no gradients, no new section wrapper.

Content:
- Eyebrow: `Membership`
- Price line: `$30/month. Cancel anytime.`
- "Includes:" list:
  - AskDerivn chat access
  - 100-page Built for Motion PDF
  - Saved conversations
  - Personalized profile context
  - Derivn-system-guided answers
- Single Apple-style pill CTA: `Get Access` → `/signup` (reuse existing button styles)

Centered, narrow max width, same typography as surrounding section. No card, no border treatment beyond existing rule lines.

### 2. `src/routes/subscribe.tsx`
- Change `$50` → `$30` (line 70).
- Verify the value list already matches the approved copy (it does: chat access, PDF, saved conversations, personalized context, Derivn-system-guided answers). Rename `Personalized context` → `Personalized profile context` for consistency with the homepage.

### 3. `src/routes/signup.tsx`
- Line 88 subtitle: `…Membership is $50/month…` → `$30/month`.
- Line 167 list item: `$50/month. Cancel anytime.` → `$30/month. Cancel anytime.`

### 4. SEO / meta
- Homepage `head()` description currently is just `"AskDerivn"` — no price mentioned, no change needed.
- `subscribe.tsx` title is `Membership — AskDerivn` — no change.

### 5. Account page (`src/routes/_authenticated.account.tsx`)
No hardcoded `$50` found. No change needed (it shows live subscription status from the backend).

### 6. Stripe price ID
The checkout route reads `process.env.STRIPE_PRICE_ID` — no code change required. Once you provide the new price ID, update the `STRIPE_PRICE_ID` secret and checkout will use it automatically.

## Out of scope
- No new pricing page.
- No mention of image/voice/audio/video features anywhere.
- No token-limit messaging.
- No design system / button / color changes.

## After approval
I will make the edits above and confirm the build is clean.
