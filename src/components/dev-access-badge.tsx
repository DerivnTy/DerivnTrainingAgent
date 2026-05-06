// TODO: remove before public launch
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isDevBypassEmail } from "@/lib/dev-bypass";

const DISMISS_KEY = "devAccessBadgeDismissed";

export function DevAccessBadge() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const email = data.session?.user.email;
      if (
        isDevBypassEmail(email) &&
        sessionStorage.getItem(DISMISS_KEY) !== "1"
      ) {
        setShow(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!show) return null;

  return (
    <div className="pointer-events-auto fixed bottom-3 right-3 z-50 flex items-center gap-2 rounded-full border border-rule bg-muted px-3 py-1 text-xs text-ink-soft shadow-sm">
      <span className="font-medium tracking-wide">DEV ACCESS</span>
      <button
        aria-label="Dismiss"
        className="text-ink-soft hover:text-foreground"
        onClick={() => {
          sessionStorage.setItem(DISMISS_KEY, "1");
          setShow(false);
        }}
      >
        ×
      </button>
    </div>
  );
}
