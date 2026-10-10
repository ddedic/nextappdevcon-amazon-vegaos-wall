/** How long each photo stays selected before the wall moves on. */
export const SELECT_EVERY_MS = 7_000;
/** A live arrival is waiting: the current photo wraps up this fast. */
export const HURRY_MS = 1_500;
/** With the spotlight closed, open the current photo full screen this often. */
export const AUTO_OPEN_EVERY_MS = 20_000;
/** How often a waiting photo swaps in for one on screen. */
export const ROTATE_EVERY_MS = 4_500;
/** OK can arrive as a key event and as a press on the focus catcher. */
export const SELECT_DEBOUNCE_MS = 300;
/** Overlay fade when the wall becomes ready. */
export const CONNECTION_FADE_MS = 450;
/** A second Back within this window exits the app. */
export const EXIT_CONFIRM_MS = 2_500;
/** One turn of the connecting spinner. */
export const SPINNER_TURN_MS = 1_100;
/** A card never waits longer than this for its image before showing. */
export const IMAGE_REVEAL_FALLBACK_MS = 2_500;
/** Waits before each retry of a failed image load; after the last one the card shows a placeholder. */
export const IMAGE_RETRY_MS = [1_000, 3_000] as const;
/** Fetch a photo's full image this long before the wall opens it full screen. */
export const PREFETCH_LEAD_MS = 4_000;
/** After a crash, the calm "restarting" screen shows this long before the wall remounts. */
export const RESTART_AFTER_MS = 3_000;
