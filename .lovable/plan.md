## Diagnosis

This is **not** a chat-page styling problem. The entire app is rendering as raw HTML — the landing page is equally unstyled. Browser console shows:

```
Refused to apply style from '.../src/styles.css' because its MIME type ('') is not a supported stylesheet MIME type
```

`curl -I /src/styles.css` returns a `302` redirect to `lovable.dev/auth-bridge`. The sandbox auth gate is intercepting requests to `/src/*` paths, so the stylesheet `<link>` produced by `import appCss from "../styles.css?url"` never resolves to actual CSS.

The chat page just looks worse because it has more interactive elements (links, inputs, buttons), so the lack of CSS is more visible.

## Fix

Switch from the SSR `<link>` injection to a side-effect import so Vite bundles the CSS into the JS graph. This is served from the regular bundle path, which the sandbox does not gate.

### `src/routes/__root.tsx`

Replace:

```ts
import appCss from "../styles.css?url";
```

with a side-effect import:

```ts
import "../styles.css";
```

And remove the `{ rel: "stylesheet", href: appCss }` entry from the `links` array in `Route` `head()`. Keep the manifest link.

That is the only change needed. With the CSS bundled into the JS chunk, Tailwind utilities, design tokens, `btn-pill`, `nav-row`, `font-serif`, `bg-background`, etc. all apply again and `/chat` (plus every other page) renders correctly.

## Out of scope

- No changes to `src/routes/_authenticated.chat.tsx`, `src/components/app-sidebar.tsx`, or any other component — they already use the correct design-system classes. Once CSS loads, they render as designed.
- No design changes, no new tokens, no layout edits.
- No functional changes.

## Verification

After the change:
- `/` renders the cream-paper landing page with serif headings (not blue raw links).
- `/chat` shows the sidebar + chat layout with pill buttons, styled input, and rounded starter cards.
- No `Refused to apply style` console error.
