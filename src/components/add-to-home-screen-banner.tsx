import { useEffect, useState } from "react";

const KEY = "askderivn:a2hs-dismissed";

export function AddToHomeScreenBanner() {
  const [show, setShow] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem(KEY)) return;
    } catch (e) {}
    const timer = setTimeout(() => {
      setShow(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleGotIt = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem(KEY, "1");
      } catch (e) {}
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-rule bg-background p-8 shadow-sm">
        <h2 className="t-h3 text-center">Add AskDerivn to your home screen</h2>
        <p className="mt-3 text-center t-body-sm text-ink-soft">
          Save AskDerivn to your phone so you can open it quickly like an app.
        </p>

        <div className="mt-8 space-y-4">
          <div className="flex items-start gap-4">
            <span className="w-16 shrink-0 pt-0.5 t-eyebrow">iPhone</span>
            <p className="t-body-sm">
              Tap the Share button, then choose “Add to Home Screen.”
            </p>
          </div>
          <div className="flex items-start gap-4">
            <span className="w-16 shrink-0 pt-0.5 t-eyebrow">Android</span>
            <p className="t-body-sm">
              Tap the browser menu, then choose “Add to Home screen” or “Install app.”
            </p>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between gap-4">
          <label className="flex cursor-pointer select-none items-center gap-2">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="h-4 w-4 cursor-pointer rounded border-rule accent-foreground"
            />
            <span className="t-body-sm text-ink-soft">Don’t tell me again</span>
          </label>
          <button
            onClick={handleGotIt}
            className="rounded-full bg-foreground px-6 py-2.5 t-eyebrow text-background transition-opacity hover:opacity-90 active:scale-[0.97]"
          >
            Got it
          </button>
        </div>

        <p className="mt-6 text-center t-meta text-ink-soft">
          AskDerivn works best when saved to your home screen.
        </p>
      </div>
    </div>
  );
}
