/** How long the "Press F for full screen" hint stays up after the page loads. */
export const HINT_VISIBLE_MS = 4000;

/** The mouse cursor hides after this long without movement. */
export const CURSOR_IDLE_MS = 2000;

/**
 * An Escape that lands this soon after leaving full screen is the browser's own exit key,
 * not a Back press (see useFullscreen).
 */
export const FULLSCREEN_ESCAPE_GRACE_MS = 500;
