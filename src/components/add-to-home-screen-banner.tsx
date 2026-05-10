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
    const t = setTimeout(() => setShow(true), 1200);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="mx-4 max-w-xs w-full bg-paper border border-rule rounded-3xl p-6 shadow-xl">
        <div className="font-serif text-xl tracking-tight text-center">
          Add AskDerivn to your home screen
        </div>
        <p className="mt-3 text-sm text-ink-soft text-center">
          Save AskDerivn to your phone so you can open it quickly like an app.
        </p>
        <div className="mt-6 space-y-3">
          <div className="text-xs">
            <span className="font-mono uppercase tracking-wider text-ink-soft">iPhone</span>
            <p className="text-ink-soft mt-1">Tap the Share button, then choose “Add to Home Screen.”</p>
          </div>
          <div className="text-xs">
            <span className="font-mono uppercase tracking-wider text-ink-soft">Android</span>
            <p className="text-ink-soft mt-1">Tap the browser menu, then choose “Add to Home screen” or “Install app.”</p>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={() => dismiss(false)}
            className="btn-primary h-11 rounded-full text-sm font-medium active:scale-[0.98] transition-all"
          >
            Got it
          </button>
          <label className="flex items-center justify-center gap-2 text-sm text-ink-soft cursor-pointer">
            <input
              type="checkbox"
              onChange={(e) => {
                // handle permanent in dismiss
              }}
              className="accent-foreground"
            />
            <span>Don’t tell me again</span>
          </label>
        </div>
      </div>
    </div>
  );
}
