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
    // Small delay so it doesn't pop in instantly after chat loads
    const t = setTimeout(() => setShow(true), 1200);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = () => {
    try {
      if (dontShowAgain) {
        localStorage.setItem(KEY, "1");
      }
    } catch {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-paper border border-rule rounded-3xl p-8 shadow-2xl">
        <div>
          <h2 className="font-serif text-2xl leading-tight text-center">Add AskDerivn to your home screen</h2>
          <p className="mt-4 text-ink-soft text-center">Save AskDerivn to your phone so you can open it quickly like an app.</p>

          <div className="mt-8 space-y-5 text-sm">
            <div className="flex gap-4">
              <div className="font-mono uppercase text-xs tracking-widest text-ink-soft pt-0.5">iPhone</div>
              <div>
                <p className="text-ink-soft">Tap the Share button, then choose “Add to Home Screen.”</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="font-mono uppercase text-xs tracking-widest text-ink-soft pt-0.5">Android</div>
              <div>
                <p className="text-ink-soft">Tap the browser menu, then choose “Add to Home screen” or “Install app.”</p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <input
              type="checkbox"
              id="dont-show-again"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 accent-foreground"
            />
            <label htmlFor="dont-show-again" className="text-sm text-ink-soft cursor-pointer select-none">
              Don’t tell me again
            </label>
          </div>

          <button
            onClick={handleDismiss}
            className="mt-8 w-full h-12 bg-foreground text-paper text-base font-medium rounded-3xl transition-all active:scale-[0.98]"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
