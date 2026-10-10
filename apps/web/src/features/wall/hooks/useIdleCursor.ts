import { useEffect, useState } from "react";

import { CURSOR_IDLE_MS } from "@/features/wall/constants/timing";

/** Whether to hide the mouse cursor: after a moment without movement, or always in kiosk mode. */
export function useIdleCursor(kiosk: boolean) {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    if (kiosk) return;
    let timer = window.setTimeout(() => setIdle(true), CURSOR_IDLE_MS);
    const onMove = () => {
      setIdle(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setIdle(true), CURSOR_IDLE_MS);
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointermove", onMove);
    };
  }, [kiosk]);
  return kiosk || idle;
}
