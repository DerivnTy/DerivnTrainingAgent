import { useEffect, useState } from "react";
import { Button } from "./ui/button";

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

  const dismiss = () => {
    try {
      if (dontShowAgain) {
        localStorage.setItem(KEY, "1");
      } else {
        localStorage.setItem(KEY, String(Date.now()));
      }
    } catch {
      // ignore
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-w-md w-full bg-background border border-rule rounded-3xl shadow-xl p-6 space-y-6">
        <div>
          <div className="font-serif text-xl tracking-tight">
            Add AskDerivn to your home screen
          </div>
          <p className="mt-3 text-ink-soft">
            Save AskDerivn to your phone so you can open it quickly like an app.
          </p>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <div className="font-mono uppercase tracking-wider text-xs text-ink-soft">iPhone</div>
            <p className="text-ink-soft">Tap the Share button, then choose “Add to Home Screen.”</p>
          </div>
          <div>
            <div className="font-mono uppercase tracking-wider text-xs text-ink-soft">Android</div>
            <p className="text-ink-soft">Tap the browser menu, then choose “Add to Home screen” or “Install app.”</p>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="w-4 h-4 accent-foreground"
          />
          <span className="text-sm text-ink-soft">Don’t tell me again</span>
        </label>

        <Button onClick={dismiss} className="w-full">
          Got it
        </Button>

        <p className="text-xs text-center text-ink-soft">
          AskDerivn works best when saved to your home screen.
        </p>
      </div>
    </div>
  );
}
