// Type-only import: this file must stay plain data, because the cf CLI loads it with Node.
import type { BoothwallConfig } from "./boothwall.schema";

/** The wall as it ran at next.app devCon 2026 in Berlin. */
export const boothwallConfig = {
  event: {
    name: "next.app devCon 2026",
    hashtag: "#nextappdevcon",
    venue: "CITYCUBE Berlin",
    year: "2026",
  },
  categories: [
    { id: "reactcon", label: "reactCon" },
    { id: "droidcon", label: "droidCon" },
    { id: "fluttercon", label: "flutterCon" },
    { id: "swiftcon", label: "swiftCon" },
    { id: "other", label: "Just here for fun", catchAll: true },
  ],
  theme: {
    primary: "#F255E3",
    secondary: "#9B6BFF",
    tertiary: "#1D85FC",
  },
  urls: {
    api: "https://nextapp-wall-api.dedic.dev",
    web: "https://nextapp-wall.dedic.dev",
    source: "https://github.com/ddedic/boothwall",
  },
  author: { handle: "@ddedic" },
  demo: false,
  retentionDays: 14,
  deploy: {
    name: "nextapp-wall",
    d1DatabaseId: "bd5f5d9b-5315-4a61-a081-7aeba8cd5f69",
    apiDomain: "nextapp-wall-api.dedic.dev",
    webDomain: "nextapp-wall.dedic.dev",
  },
} as const satisfies BoothwallConfig;
