/** Colour maths for brand colours from the config: readable text and translucent variants. */

const DARK = "#000000";
const LIGHT = "#FFFFFF";

/** WCAG AA for large text and UI: brand colours are used for headings, chips and fills. */
const MIN_CONTRAST = 3;

function channels(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** Black or white, whichever reads better on `background`. */
export function textOn(background: string): string {
  return contrast(background, DARK) >= contrast(background, LIGHT) ? DARK : LIGHT;
}

function toHex(rgb: [number, number, number]): string {
  return `#${rgb.map((channel) => Math.round(channel).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

/** `amount` of the way from `from` to `to`, per channel. */
function mix(from: string, to: string, amount: number): string {
  const a = channels(from);
  const b = channels(to);
  return toHex([0, 1, 2].map((i) => a[i]! + (b[i]! - a[i]!) * amount) as [number, number, number]);
}

/**
 * `color` as text on `background`. When it's too faint, it's shaded towards black or white
 * just enough to read, so a light brand colour on a white card stays recognisably on-brand.
 */
export function readableOn(color: string, background: string): string {
  if (contrast(color, background) >= MIN_CONTRAST) return color;
  const target = textOn(background);
  for (let step = 1; step <= 10; step++) {
    const shaded = mix(color, target, step / 10);
    if (contrast(shaded, background) >= MIN_CONTRAST) return shaded;
  }
  return target;
}

/** `rgba()` for a hex colour, for glows and tints. */
export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = channels(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
