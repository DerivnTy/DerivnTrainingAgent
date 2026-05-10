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
    const t = setTimeout(() => setShow(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const handleGotIt = () => {
    try {
      if (dontShowAgain) {
        localStorage.setItem(KEY, "1");
      }
    } catch {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="mx-4 max-w-md w-full bg-paper rounded-3xl border border-rule p-8 shadow-2xl">
        <div className="text-center">
          <div className="font-serif text-2xl tracking-tight mb-1">
            Add AskDerivn to your home screen
          </div>
          <p className="text-ink-soft mb-6">
            Save AskDerivn to your phone so you can open it quickly like an app.
          </p>
          <div className="text-left space-y-5 text-sm">
            <div>
              <span className="font-mono uppercase tracking-wider text-xs text-ink-soft">iPhone</span>
              <p className="mt-1.5">Tap the Share button, then choose “Add to Home Screen.”</p>
            </div>
            <div>
              <span className="font-mono uppercase tracking-wider text-xs text-ink-soft">Android</span>
              <p className="mt-1.5">Tap the browser menu, then choose “Add to Home screen” or “Install app.”</p>
            </div>
          </div>

          <div className="mt-10 flex items-center justify-between">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 accent-foreground rounded"
              />
              <span className="text-sm text-ink-soft">Don’t tell me again</span>
            </label>
            <button
              onClick={handleGotIt}
              className="btn-primary px-8 py-3 rounded-3xl text-sm font-medium active:scale-95 transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
