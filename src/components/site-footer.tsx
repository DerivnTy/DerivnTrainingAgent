export function SiteFooter() {
  return (
    <footer className="border-t border-rule">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-8 text-xs text-ink-soft">
        <span>© {new Date().getFullYear()} Derivn</span>
        <span>Educational. Not a substitute for medical care.</span>
      </div>
    </footer>
  );
}
