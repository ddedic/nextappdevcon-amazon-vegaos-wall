import { useEffect, useState } from "react";

/** True for `ms` after mount (never, when `enabled` is false). */
export function useTimedFlag(ms: number, enabled: boolean) {
  const [on, setOn] = useState(enabled);
  useEffect(() => {
    if (!enabled) return;
    const timer = window.setTimeout(() => setOn(false), ms);
    return () => window.clearTimeout(timer);
  }, [ms, enabled]);
  return on && enabled;
}
