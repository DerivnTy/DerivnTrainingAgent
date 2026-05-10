import { useEffect, useState } from "react";

const KEY = "askderivn:a2hs-dismissed";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
      <div className="max-w-md w-full bg-paper rounded-3xl border border-rule shadow-xl p-6">
        <div className="text-center">
          <h2 className="font-serif text-2xl tracking-tight text-ink">
            Add AskDerivn to your home screen
          </h2>
          <p className="mt-3 text-sm text-ink-soft leading-relaxed">
            Save AskDerivn to your phone so you can open it quickly like an app.
          </p>

          <div className="mt-8 text-left text-sm text-ink-soft space-y-4">
            <div>
              <span className="font-mono uppercase text-xs tracking-widest text-ink">iPhone</span>
              <p className="mt-1">Tap the Share button, then choose “Add to Home Screen.”</p>
            </div>
            <div>
              <span className="font-mono uppercase text-xs tracking-widest text-ink">Android</span>
              <p className="mt-1">Tap the browser menu, then choose “Add to Home screen” or “Install app.”</p>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2">
            <input
              type="checkbox"
              id="dont-show"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 accent-ink"
            />
            <label htmlFor="dont-show" className="text-sm text-ink-soft cursor-pointer select-none">
              Don’t tell me again
            </label>
          </div>

          <button
            onClick={dismiss}
            className="mt-6 w-full btn-primary btn-pill-lg"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
