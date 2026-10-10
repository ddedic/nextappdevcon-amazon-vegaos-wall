import { boothwallConfig, EVENT, SHOWCASE_LABEL } from "@boothwall/shared";

export const wallCopy = {
  author: {
    kicker: SHOWCASE_LABEL,
    handle: boothwallConfig.author.handle,
    scan: "Scan for the source",
  },
  hashtag: EVENT.hashtag,
  moments: (n: number) => (n === 1 ? "moment" : "moments"),
  joinTitle: "Get on the wall",
  battleTitle: "Who's here",
  empty: {
    eyebrow: "Live wall",
    title: "Your photo could be\nup here.",
    body: "Scan the code with your phone, snap a photo and watch it land on this screen.",
    steps: ["Scan the code", "Snap a photo", "Watch it land"],
    ghost: "You?",
    scanMe: "Scan me",
  },
  openSelected: "Open the selected photo",
  newBadge: "NEW",
  noCaption: "No caption, just vibes",
  nowShowing: "Now showing",
  incoming: { title: "New photo", upNext: "up next" },
  nextPhoto: "Next photo",
  paused: "Paused",
  position: (current: number, total: number) => `${current} of ${total}`,
  counter: (current: number, total: number) => `${current} / ${total}`,
  connection: {
    connecting: "Connecting to the live wall",
    loading: "Loading photos",
    failedTitle: "Can't reach the wall",
    failedBody: "Check this device's network connection. Retrying automatically.",
    attempt: (n: number) => `Attempt ${n}`,
  },
  restarting: {
    title: "Restarting the wall…",
    body: "Back in a moment.",
  },
  exitHint: { before: "Press ", key: "Back", after: " again to exit" },
  status: {
    connecting: "Connecting",
    live: "Live",
    offline: "Reconnecting",
    simulated: "Demo",
  },
} as const;
