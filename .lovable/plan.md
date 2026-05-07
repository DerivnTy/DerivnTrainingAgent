## Goal

Style user messages as right-aligned iMessage-style bubbles. Assistant replies stay as the current plain left-aligned text — only the user side changes.

## Changes (only `src/routes/_authenticated.chat.tsx`)

In the message render loop (the `messages.map` block):

- **User message**: render in a right-aligned wrapper (`flex justify-end`) as a rounded bubble — `rounded-2xl bg-primary text-primary-foreground px-4 py-2 max-w-[80%]`, with `whitespace-pre-wrap` text inside. Drop the "YOU" label and the top border separator on user messages.
- **Assistant message**: keep as-is (left-aligned, "ASKDERIVN" label, markdown body, border-top between turns).
- **"Thinking…" placeholder**: keep left-aligned as-is.

Out of scope: starters, input bar, sidebar, top strip, colors beyond existing `--primary` token.

## Technical notes

- File touched: `src/routes/_authenticated.chat.tsx` only.
- Use existing semantic tokens (`bg-primary`, `text-primary-foreground`) so it works in light/dark.
- Border-top separator logic needs to skip when the previous message was from the user (or always skip on user messages) to avoid stray rules above bubbles.
