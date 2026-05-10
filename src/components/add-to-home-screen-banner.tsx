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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-sm p-4">
      <div className="max-w-md w-full bg-paper rounded-3xl border border-rule p-8 shadow-2xl">
        <h2 className="font-serif text-2xl tracking-tight text-center">Add AskDerivn to your home screen</h2>
        <p className="mt-3 text-center text-ink-soft">Save AskDerivn to your phone so you can open it quickly like an app.</p>
        <div className="mt-8 space-y-6">
          <div className="space-y-5">
            <div className="flex gap-3">
              <div className="font-mono text-xs uppercase tracking-widest bg-rule/50 text-ink-soft px-3 py-1 rounded-2xl flex-shrink-0 h-fit">iPhone</div>
              <p className="text-sm leading-relaxed">Tap the Share button, then choose “Add to Home Screen.”</p>
            </div>
            <div className="flex gap-3">
              <div className="font-mono text-xs uppercase tracking-widest bg-rule/50 text-ink-soft px-3 py-1 rounded-2xl flex-shrink-0 h-fit">Android</div>
              <p className="text-sm leading-relaxed">Tap the browser menu, then choose “Add to Home screen” or “Install app.”</p>
            </div>
          </div>
        </div>
        <div className="mt-10 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 accent-foreground rounded border-rule cursor-pointer"
            />
            <span className="text-sm text-ink-soft">Don’t tell me again</span>
          </label>
          <button 
            onClick={handleGotIt}
            className="rounded-full bg-foreground text-paper px-8 py-3 text-sm font-medium transition-all active:scale-[0.97] hover:brightness-110"
          >
            Got it
          </button>
        </div>
        <p className="mt-6 text-xs text-center text-ink-soft">AskDerivn works best when saved to your home screen.</p>
      </div>
    </div>
  );
}
