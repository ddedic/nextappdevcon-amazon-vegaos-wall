/** Sizes are dp on Vega's 960x540 canvas (1080p at 2x). */
export const color = {
  canvas: "#000000",
  transparent: "transparent",
  scrim: "rgba(0, 0, 0, 0.35)",
  surface: "rgba(255, 255, 255, 0.07)",
  surfaceFocused: "rgba(255, 255, 255, 0.18)",
  border: "rgba(255, 255, 255, 0.14)",
  textPrimary: "#FFFFFF",
  textSecondary: "#C9CCDA",
  textMuted: "#8A8FA3",
  textOnFocus: "#000000",
  brandPink: "#F255E3",
  brandViolet: "#9B6BFF",
  success: "#3DDC97",
  warning: "#FFC857",
  danger: "#FF6B6B",
  focusRing: "#FFFFFF",
  paper: "#FBFAF7",
  paperInk: "#1B1B22",
  shadow: "#000000",
  spotlightScrim: "rgba(0, 0, 0, 0.72)",
} as const;

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, "2xl": 48 } as const;

/** TV-safe margins: keep text and controls inside these on every screen. */
export const layout = { safeX: 64, safeY: 40 } as const;

export const fontSize = { caption: 11, body: 15, lead: 18, heading: 24, title: 44 } as const;

export const radius = { card: 16, pill: 999 } as const;
