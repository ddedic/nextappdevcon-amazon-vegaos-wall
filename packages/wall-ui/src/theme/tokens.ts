import { boothwallConfig, readableOn, textOn } from "@boothwall/shared";

const { primary, secondary } = boothwallConfig.theme;
const CANVAS = "#000000";

/** `#RRGGBB` plus an alpha, for translucent brand colours. */
const withAlpha = (hex: string, alpha: number) =>
  `rgba(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(", ")}, ${alpha})`;
const PAPER = "#FBFAF7";

/**
 * The one place with literal colours. Brand colours come from boothwall.config.ts; the
 * text variants fall back to black or white when the brand colour wouldn't be readable.
 * Sizes are dp on Vega's 960x540 canvas (1080p at 2x).
 */
export const color = {
  canvas: CANVAS,
  transparent: "transparent",
  surface: "rgba(255, 255, 255, 0.07)",
  /** For panels over the bright part of the backdrop (the horizon glow), so text stays readable. */
  surfaceSolid: "rgba(9, 11, 19, 0.86)",
  surfaceFocused: "rgba(255, 255, 255, 0.18)",
  border: "rgba(255, 255, 255, 0.14)",
  textPrimary: "#FFFFFF",
  textSecondary: "#C9CCDA",
  textMuted: "#8A8FA3",
  /** Brand fills, borders and glows. */
  brandPrimary: primary,
  brandSecondary: secondary,
  /** Bars behind the leader in the crowd battle. */
  brandPrimaryMuted: withAlpha(primary, 0.45),
  /** Brand colour as text on the dark canvas. */
  brandPrimaryText: readableOn(primary, CANVAS),
  /** Brand colours as text on a polaroid card. */
  brandPrimaryOnPaper: readableOn(primary, PAPER),
  brandSecondaryOnPaper: readableOn(secondary, PAPER),
  /** Text on top of a primary fill (chips, badges). */
  onBrandPrimary: textOn(primary),
  /** Text on top of a secondary fill (the spotlight category chip). */
  onBrandSecondary: textOn(secondary),
  success: "#3DDC97",
  warning: "#FFC857",
  danger: "#FF6B6B",
  focusRing: "#FFFFFF",
  /** Soft brand halo just outside the focus ring: a flat border, no blurred shadow. */
  focusHalo: withAlpha(primary, 0.4),
  paper: PAPER,
  paperInk: "#1B1B22",
  /** Separators and quiet text on the polaroid paper. */
  paperInkMuted: "#9A9AA3",
  shadow: "#000000",
  /** Flat stand-in for a drop shadow under wall cards. */
  cardShadowOuter: "rgba(0, 0, 0, 0.16)",
  cardShadowInner: "rgba(0, 0, 0, 0.24)",
  spotlightScrim: "rgba(0, 0, 0, 0.86)",
  /** Behind the spotlight text, so busy cards underneath never compete with it. */
  spotlightPanel: "rgba(0, 0, 0, 0.55)",
} as const;

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, "2xl": 48 } as const;

/** TV-safe margins: keep text and controls inside these on every screen. */
export const layout = { safeX: 64, safeY: 40 } as const;

export const fontSize = { caption: 11, body: 15, lead: 18, heading: 24, title: 44 } as const;

export const radius = { card: 16, pill: 999 } as const;

/** Letter spacing: tight for big headings, wide for small caps labels. */
export const tracking = { title: -1.5, heading: -0.5, caption: -0.1, label: 1.2, mark: 2 } as const;

/** Fixed element sizes in dp. */
export const size = {
  logoHeight: 32,
  joinQr: 112,
  barTrack: 3,
  shadowSpread: 3,
  tiltInset: 2,
  stripLine: 2,
  leaderBar: 5,
  rankDot: 6,
  focusRing: 3,
  focusHalo: 4,
  focusDot: 6,
} as const;
