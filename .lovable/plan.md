## Change
Update `src/components/site-footer.tsx` to add a link to derivn.com next to the copyright.

```
© 2026 AskDerivn  ·  derivn.com
```

The link will:
- Point to `https://derivn.com`
- Open in a new tab (`target="_blank"`, `rel="noopener noreferrer"`)
- Use the existing footer `t-meta` style with a hover state (`text-link hover:text-foreground`)
- Sit on the same centered row, separated by a middle-dot

No other files change.
