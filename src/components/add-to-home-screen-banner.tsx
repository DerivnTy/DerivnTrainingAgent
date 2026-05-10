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
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) return;
    try {
      if (localStorage.getItem(KEY)) return;
    } catch {
      return;
    }
    // Small delay so it doesn't pop in instantly
    const t = setTimeout(() => setShow(true), 1200);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = () => {
    try {
      if (dontShowAgain) {
        localStorage.setItem(KEY, "1");
      } else {
        localStorage.setItem(KEY, String(Date.now()));
      }
    } catch {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="mx-4 max-w-md w-full rounded-3xl bg-paper border border-rule shadow-xl overflow-hidden">
        <div className="px-6 pt-6 pb-2">
          <div className="font-serif text-2xl tracking-tight text-ink">
            Add AskDerivn to your home screen
          </div>
          <p className="mt-3 text-ink-soft">
            Save AskDerivn to your phone so you can open it quickly like an app.
          </p>

          <div className="mt-6 space-y-4 text-sm">
            <div>
              <span className="font-mono uppercase tracking-wider text-xs text-ink-soft">iPhone</span>
              <p className="mt-1">Tap the Share button, then choose “Add to Home Screen.”</p>
            </div>
            <div>
              <span className="font-mono uppercase tracking-wider text-xs text-ink-soft">Android</span>
              <p className="mt-1">Tap the browser menu, then choose “Add to Home screen” or “Install app.”</p>
            </div>
          </div>
        </div>

        <div className="border-t border-rule px-6 py-4 flex items-center gap-3 bg-paper">
          <label className="flex items-center gap-2 flex-1 cursor-pointer">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="accent-foreground"
            />
            <span className="text-sm text-ink-soft">Don’t tell me again</span>
          </label>

          <button
            onClick={handleDismiss}
            className="btn-primary px-8 h-10 text-sm font-medium rounded-3xl"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
