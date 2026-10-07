import { EVENT } from "@vegaos-demo/shared";

export const wallCopy = {
  author: {
    kicker: "Amazon Vega OS showcase",
    handle: "@ddedic",
    scan: "Scan for the source",
  },
  hashtag: EVENT.hashtag,
  /** Stacked two-and-two so it mirrors the two-line logo. */
  year: ["20", "26"],
  moments: (n: number) => (n === 1 ? "moment" : "moments"),
  joinTitle: "Get on the wall",
  battleTitle: "Tribe battle",
  empty: {
    eyebrow: "Live wall",
    title: "Your photo could be\nup here.",
    body: "Scan the code with your phone, snap a photo and watch it land on this screen.",
    steps: ["Scan the code", "Snap a photo", "Watch it land"],
    ghost: "You?",
    scanMe: "Scan me",
  },
  newBadge: "NEW",
  noCaption: "No caption, just vibes",
  nowShowing: "Now showing",
  incoming: { title: "New photo", upNext: "up next" },
  nextPhoto: "Next photo",
  paused: "Paused · press ⏯ to resume",
  position: (current: number, total: number) => `${current} of ${total}`,
  connection: {
    connecting: "Connecting to the live wall",
    loading: "Loading photos",
    failedTitle: "Can't reach the wall",
    failedBody: "Check this device's network connection. Retrying automatically.",
    attempt: (n: number) => `Attempt ${n}`,
  },
  exitHint: { before: "Press ", key: "Back", after: " again to exit" },
  status: {
    connecting: "Connecting",
    live: "Live",
    offline: "Reconnecting",
    simulated: "Simulated",
  },
} as const;
