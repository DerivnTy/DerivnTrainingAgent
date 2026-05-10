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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-[#F5F4F0] max-w-md w-full mx-4 rounded-3xl shadow-xl border border-[#E5E4DF] overflow-hidden">
        <div className="p-8">
          <h2 className="text-2xl font-semibold text-[#0A0A0A] tracking-tight mb-2">
            Add AskDerivn to your home screen
          </h2>
          <p className="text-[#3A3A3A] text-[17px] leading-relaxed">
            Save AskDerivn to your phone so you can open it quickly like an app.
          </p>
          <div className="mt-8 space-y-5 text-[#3A3A3A] text-sm">
            <div>
              <p className="font-medium mb-1">For iPhone:</p>
              <p>Tap the Share button, then choose “Add to Home Screen.”</p>
            </div>
            <div>
              <p className="font-medium mb-1">For Android:</p>
              <p>Tap the browser menu, then choose “Add to Home screen” or “Install app.”</p>
            </div>
          </div>
        </div>

        <div className="border-t border-[#E5E4DF] p-5 flex items-center gap-4">
          <label className="flex items-center gap-2 flex-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="accent-[#0A0A0A]"
            />
            <span className="text-sm text-[#3A3A3A]">Don’t tell me again</span>
          </label>
          
          <button
            onClick={handleDismiss}
            className="rounded-3xl bg-[#0A0A0A] px-8 py-3.5 text-sm font-medium text-white active:scale-95 transition-all duration-200"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
