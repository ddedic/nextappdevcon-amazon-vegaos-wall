import type { PhotoDTO } from "@boothwall/shared";

// Collage geometry on the 960x540 dp canvas.

export type SlotPosition = { x: number; y: number; rotate: number };
export type PlacedPhoto = { photo: PhotoDTO; slot: SlotPosition };

/** `aspect` is the approximate card height per unit of width. */
export const POLAROID = { width: 122, aspect: 1.27 } as const;

/**
 * Polaroid type, in dp for a 118 dp wide card; it scales with the card. Captions up to `short`
 * characters get the large size, up to `medium` the middle one, and longer ones the small one,
 * so most fit on a wall card instead of trailing off.
 */
export const POLAROID_TYPE = {
  baseWidth: 118,
  short: 20,
  medium: 25,
  caption: { large: 9.5, medium: 8, small: 7 },
  captionLine: 12,
  meta: 5.5,
  metaTracking: 0.5,
  metaGap: 3,
} as const;

/** The empty wall's headline block, left of the ghost cards. */
export const EMPTY_HERO = { top: 128, width: 440 } as const;

/** Outer margin shared by the top bar, photo area, now-showing bar and side panel. */
export const EDGE = 48;
export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 540;

export const PANEL = { left: CANVAS_WIDTH - EDGE - 196, top: 80, width: 196 } as const;

/** Bottom edge shared by the now-showing strip and the source card. */
const BOTTOM = 516;

/** A slim one-line strip, so the collage gets the height. */
export const NOW_BAR = { left: EDGE, top: BOTTOM - 32, width: 652, height: 32 } as const;

/** Bottom-right "source on GitHub" card: taller than the strip (its QR must scan), same bottom. */
const SOURCE_CARD_HEIGHT = 54;
export const SOURCE_CARD = {
  left: PANEL.left,
  top: BOTTOM - SOURCE_CARD_HEIGHT,
  width: PANEL.width,
  height: SOURCE_CARD_HEIGHT,
} as const;

export const GHOST_SLOTS: SlotPosition[] = [
  { x: 548, y: 86, rotate: 5 },
  { x: 586, y: 236, rotate: -4 },
  { x: 506, y: 330, rotate: 3 },
];

export const SLOTS: SlotPosition[] = [
  { x: 52, y: 80, rotate: -5 },
  { x: 208, y: 74, rotate: 3 },
  { x: 366, y: 84, rotate: -2 },
  { x: 528, y: 76, rotate: 4 },
  { x: 120, y: 204, rotate: 4 },
  { x: 282, y: 198, rotate: -3 },
  { x: 446, y: 208, rotate: 2 },
  { x: 582, y: 222, rotate: -5 },
  { x: 40, y: 312, rotate: -2 },
  { x: 204, y: 318, rotate: 5 },
  { x: 368, y: 310, rotate: -4 },
];

const SPOTLIGHT_CARD_WIDTH = 320;
const SPOTLIGHT_DETAILS_WIDTH = 340;
const SPOTLIGHT_GAP = 48;
export const SPOTLIGHT = {
  cardWidth: SPOTLIGHT_CARD_WIDTH,
  cardLeft: (CANVAS_WIDTH - SPOTLIGHT_CARD_WIDTH - SPOTLIGHT_GAP - SPOTLIGHT_DETAILS_WIDTH) / 2,
  cardRotate: -2,
  detailsWidth: SPOTLIGHT_DETAILS_WIDTH,
  gap: SPOTLIGHT_GAP,
} as const;

/** Start-up overlay card: wide enough for the error copy on two lines. */
export const CONNECTING_CARD_WIDTH = 420;
