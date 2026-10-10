import type { Plugin } from "vite";

import { boothwallConfig } from "../../../../packages/shared/src/config/boothwall.config";
import { readableOn, textOn, withAlpha } from "../../../../packages/shared/src/config/color";

const CANVAS = "#000000";

/** Brand CSS variables from boothwall.config.ts; the theme CSS only references them. */
function brandVariables(): string {
  const { primary, secondary, tertiary } = boothwallConfig.theme;
  const variables = {
    "--u-primary": primary,
    "--u-primary-text": readableOn(primary, CANVAS),
    "--u-on-primary": textOn(primary),
    "--u-primary-glow": withAlpha(primary, 0.55),
    "--u-secondary": secondary,
    "--u-tertiary": tertiary,
  };
  const body = Object.entries(variables)
    .map(([name, value]) => `${name}:${value}`)
    .join(";");
  return `:root{${body}}`;
}

/**
 * The `/gh` short link the TV's "Scan for the source" QR points to (upper case keeps the QR
 * coarse), and the old /admin (Control panel) and /wall (now the home page) addresses.
 */
function redirects(): string {
  const { source } = boothwallConfig.urls;
  return (
    [
      ...["/gh", "/GH"].map((path) => `${path} ${source} 302`),
      "/admin /control 301",
      "/admin/* /control 301",
      "/wall / 301",
      // The TV's join QR is upper case; the app copes either way, this just tidies the address.
      "/SNAP /snap 301",
      "/wall/* / 301",
    ].join("\n") + "\n"
  );
}

/**
 * Applies boothwall.config.ts to the web app: the event name in the title and meta tags,
 * the brand colours as CSS variables (inlined, so the first paint is already on-brand) and
 * the `/gh`, `/admin` and `/wall` redirects.
 */
export function boothwall(): Plugin {
  return {
    name: "boothwall",
    generateBundle() {
      if (this.environment.name !== "client") return;
      this.emitFile({ type: "asset", fileName: "_redirects", source: redirects() });
    },
    transformIndexHtml: {
      order: "pre",
      handler: (html) => ({
        html: html.replaceAll("%EVENT_NAME%", boothwallConfig.event.name),
        tags: [{ tag: "style", children: brandVariables(), injectTo: "head-prepend" }],
      }),
    },
  };
}
