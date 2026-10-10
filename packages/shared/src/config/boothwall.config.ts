// Type-only import: this file must stay plain data, because the cf CLI loads it with Node.
import type { BoothwallConfig } from "./boothwall.schema";

/**
 * Make BoothWall yours: this is the one file to edit. The TV app, the web app and the
 * API all read it at build time. Every field is explained in docs/customising.md.
 *
 * Logo, backdrop and icons are images in packages/wall-ui/src/assets/brand, apps/tv/assets/image,
 * apps/web/src/assets/brand and apps/web/public. `pnpm boothwall setup` creates your
 * Cloudflare resources and fills in `urls`, `demo` and `deploy` for you.
 */
export const boothwallConfig = {
  event: {
    name: "BoothWall Live Demo",
    hashtag: "#VegaOS",
    year: "2026",
  },
  categories: [
    { id: "fire-tv", label: "Fire TV apps" },
    { id: "vega-os", label: "Vega OS" },
    { id: "react-native", label: "React Native" },
    { id: "web-cloud", label: "Web & cloud" },
    { id: "visiting", label: "Just visiting", catchAll: true },
  ],
  theme: {
    primary: "#FF9900",
    secondary: "#00A8E1",
    tertiary: "#7B61FF",
  },
  urls: {
    api: "https://boothwall-api.dedic.dev",
    web: "https://boothwall.dedic.dev",
    source: "https://github.com/ddedic/boothwall",
  },
  author: { handle: "@ddedic" },
  // Runs the TV on the bundled demo photos until you deploy your API (`pnpm boothwall setup`).
  demo: false,
  retentionDays: 14,
  deploy: {
    name: "boothwall",
    d1DatabaseId: "b0dd67fb-ab57-4204-afd6-793f3617c60e",
    apiDomain: "boothwall-api.dedic.dev",
    webDomain: "boothwall.dedic.dev",
  },
} as const satisfies BoothwallConfig;
