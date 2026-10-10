import type { RemoteHandlers } from "@boothwall/wall-ui";
import { useEffect, useRef } from "react";

import { KEY_COMMANDS } from "@/features/wall/constants/keys";
import { isFullscreenEscape } from "@/features/wall/hooks/useFullscreen";

/** The wall's remote in a browser: arrows, Enter, Space and Escape or Backspace for Back. */
export function useKeyboardRemote(handlers: RemoteHandlers) {
  // The director rebuilds its handlers often; listen once and call the latest.
  const latest = useRef(handlers);
  latest.current = handlers;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const command = KEY_COMMANDS[event.key];
      if (!command || event.altKey || event.ctrlKey || event.metaKey) return;
      // The Escape that leaves full screen is the browser's; it isn't also a Back press.
      if (event.key === "Escape" && isFullscreenEscape()) return;
      // Space would scroll and Backspace could navigate; held keys repeat, a remote doesn't.
      event.preventDefault();
      if (!event.repeat) latest.current[command]?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
