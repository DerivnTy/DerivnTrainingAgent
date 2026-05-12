export function SiteFooter() {
  return (
    <footer className="border-t border-rule">
      <div className="mx-auto flex max-w-5xl items-center justify-center gap-2 px-6 py-8 t-meta">
        <span>© 2026 AskDerivn</span>
        <span aria-hidden>·</span>
        <a
          href="https://derivn.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-link hover:text-foreground"
        >
          derivn.com
        </a>
      </div>
    </footer>
  );
}
