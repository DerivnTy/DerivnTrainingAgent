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
    // Small delay so it doesn't pop in instantly on first chat load
    const t = setTimeout(() => setShow(true), 1200);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="max-w-md w-full bg-paper border border-rule rounded-3xl shadow-xl overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <h2 className="font-serif text-2xl tracking-tight text-foreground">
            Add AskDerivn to your home screen
          </h2>
          <p className="mt-3 text-ink-soft">
            Save AskDerivn to your phone so you can open it quickly like an app.
          </p>
          <div className="mt-6 space-y-4 text-sm">
            <div>
              <span className="font-mono uppercase text-xs tracking-wider text-ink-soft">iPhone</span>
              <p className="text-ink">Tap the Share button, then choose “Add to Home Screen.”</p>
            </div>
            <div>
              <span className="font-mono uppercase text-xs tracking-wider text-ink-soft">Android</span>
              <p className="text-ink">Tap the browser menu, then choose “Add to Home screen” or “Install app.”</p>
            </div>
          </div>
        </div>

        <div className="bg-background border-t border-rule px-6 py-4 flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-ink-soft cursor-pointer">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="accent-foreground"
            />
            <span>Don’t tell me again</span>
          </label>

          <button
            onClick={dismiss}
            className="btn-primary px-8 py-2 text-sm rounded-3xl"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
