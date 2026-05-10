## Problem

On the account page, "← Back to chat" sits on its own row above the "Account" heading, so the link appears slightly higher than the heading instead of being aligned with it.

Currently in `src/routes/_authenticated.account.tsx` (lines 299–307):

- A `<div class="flex justify-end">` row holds the back link.
- The `<h1>Account</h1>` is rendered on the next row with `mt-6`.

## Fix

Combine the back link and the heading into a single flex row, vertically centered, with the heading on the left and the link on the right.

- Replace the two-row block with one `<div class="flex items-center justify-between">` containing the `<h1>` (no top margin) and the `<Link>`.
- Move the `mt-6` spacing onto the supporting paragraph instead so the rest of the page rhythm is preserved.
- Keep all existing classes on the heading and link (typography, colors, hover state) unchanged.

No other changes — only the top-of-page layout in `_authenticated.account.tsx`.
