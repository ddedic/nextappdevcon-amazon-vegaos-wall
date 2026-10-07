import { z } from "zod";

/** Co-located conferences attendees can "represent". Powers the tribe battle. */
export const TRIBES = {
  reactcon: "reactCon",
  droidcon: "droidCon",
  fluttercon: "flutterCon",
  swiftcon: "swiftCon",
  other: "Just here for fun",
} as const;

export type Tribe = keyof typeof TRIBES;

export const tribeSchema = z.enum(Object.keys(TRIBES) as [Tribe, ...Tribe[]]);
