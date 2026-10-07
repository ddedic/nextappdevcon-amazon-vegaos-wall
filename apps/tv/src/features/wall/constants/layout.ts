import type { PhotoDTO } from "@vegaos-demo/shared";

// Collage geometry on the 960x540 dp canvas.

export type SlotPosition = { x: number; y: number; rotate: number };
export type PlacedPhoto = { photo: PhotoDTO; slot: SlotPosition };

/** `aspect` is the approximate card height per unit of width. */
export const POLAROID = { width: 118, aspect: 1.27 } as const;

/** Outer margin shared by the top bar, photo area, now-showing bar and side panel. */
export const EDGE = 48;
export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 540;

export const PANEL = { left: CANVAS_WIDTH - EDGE - 196, top: 80, width: 196 } as const;

export const NOW_BAR = { left: EDGE, top: 462, width: 652, height: 54 } as const;

/** Bottom-right "source on GitHub" card: same row and height as the now-showing bar. */
export const SOURCE_CARD = {
  left: PANEL.left,
  top: NOW_BAR.top,
  width: PANEL.width,
  height: NOW_BAR.height,
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
  { x: 120, y: 196, rotate: 4 },
  { x: 282, y: 190, rotate: -3 },
  { x: 446, y: 200, rotate: 2 },
  { x: 586, y: 214, rotate: -5 },
  { x: 40, y: 300, rotate: -2 },
  { x: 204, y: 306, rotate: 5 },
  { x: 368, y: 298, rotate: -4 },
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
