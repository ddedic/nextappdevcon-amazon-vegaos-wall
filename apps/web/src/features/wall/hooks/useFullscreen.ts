import { useEffect, useState } from "react";

import { FULLSCREEN_ESCAPE_GRACE_MS } from "@/features/wall/constants/timing";

let lastFullscreenExit = 0;

/**
 * True when an Escape press belongs to the browser's full screen, so the wall shouldn't also
 * treat it as Back. While the page is full screen the browser takes Escape to leave it; most
 * browsers swallow that key, but some still deliver the keydown, either before the exit
 * (fullscreenElement still set) or just after it. Either way that one press only leaves full
 * screen. Once out of full screen, Escape is Back again (twice to arm and confirm the exit hint).
 */
export function isFullscreenEscape(): boolean {
  if (document.fullscreenElement) return true;
  return performance.now() - lastFullscreenExit < FULLSCREEN_ESCAPE_GRACE_MS;
}

function toggleFullscreen() {
  if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
  else void document.documentElement.requestFullscreen?.().catch(() => undefined);
}

/**
 * Browser full screen for the wall: F or a double-click toggles it. With `auto` (`?fullscreen`)
 * the first key press or click enters it, since browsers refuse full screen without a gesture.
 */
export function useFullscreen(auto: boolean) {
  const [active, setActive] = useState(() => Boolean(document.fullscreenElement));

  useEffect(() => {
    const onChange = () => {
      const now = Boolean(document.fullscreenElement);
      if (!now) lastFullscreenExit = performance.now();
      setActive(now);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        toggleFullscreen();
      }
    };
    document.addEventListener("fullscreenchange", onChange);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("dblclick", toggleFullscreen);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("dblclick", toggleFullscreen);
    };
  }, []);

  useEffect(() => {
    if (!auto) return;
    const enter = (event: Event) => {
      // Escape can't grant full screen, and F already toggles it.
      if (event instanceof KeyboardEvent && ["Escape", "f", "F"].includes(event.key)) return;
      if (!document.fullscreenElement) toggleFullscreen();
      window.removeEventListener("keydown", enter);
      window.removeEventListener("pointerdown", enter);
    };
    window.addEventListener("keydown", enter);
    window.addEventListener("pointerdown", enter);
    return () => {
      window.removeEventListener("keydown", enter);
      window.removeEventListener("pointerdown", enter);
    };
  }, [auto]);

  return active;
}
