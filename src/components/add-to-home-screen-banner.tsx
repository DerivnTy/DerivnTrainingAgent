import { useEffect, useState } from "react";

const KEY = "askderivn:a2hs-dismissed";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function AddToHomeScreenBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) return;
    try {
      if (localStorage.getItem(KEY)) return;
    } catch {
      return;
    }
    // Small delay so it doesn't pop in instantly
    const t = setTimeout(() => setShow(true), 600);
    return () => clearTimeout(t);
  }, []);

  const dismiss = (permanent: boolean) => {
    try {
      if (permanent) localStorage.setItem(KEY, "1");
      else localStorage.setItem(KEY, String(Date.now()));
    } catch {
      // ignore
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="border-t border-rule bg-background">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="font-serif text-base tracking-tight">
            Add AskDerivn to your home screen
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            For faster access, save AskDerivn like an app on your phone.
          </p>
          <p className="mt-2 text-xs text-ink-soft">
            <span className="font-mono uppercase tracking-wider">iPhone</span>{" "}
            — Tap Share, then “Add to Home Screen.”
          </p>
          <p className="mt-1 text-xs text-ink-soft">
            <span className="font-mono uppercase tracking-wider">Android</span>{" "}
            — Tap the browser menu, then “Add to Home screen” or “Install app.”
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
          <button
            type="button"
            onClick={() => dismiss(false)}
            className="rounded-sm border border-rule px-3 py-1.5 text-xs hover:border-foreground"
          >
            Got it
          </button>
          <button
            type="button"
            onClick={() => dismiss(true)}
            className="text-xs text-ink-soft underline-offset-2 hover:underline"
          >
            Don't show again
          </button>
        </div>
      </div>
    </div>
  );
}
