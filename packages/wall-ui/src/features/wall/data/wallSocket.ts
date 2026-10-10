import { type WallEvent, wallEventSchema } from "@boothwall/shared";

import { MAX_BACKOFF_MS } from "../constants/feed";

/** The realtime socket every wall listens on, TV or browser. */
export const wallSocketUrl = (apiBaseUrl: string) =>
  `${apiBaseUrl.replace(/^http/, "ws")}/wall/live`;

/** Exponential with jitter, so a room full of screens doesn't reconnect in lockstep after a blip. */
export const reconnectDelayMs = (attempt: number) =>
  Math.min(MAX_BACKOFF_MS, 1000 * 2 ** Math.min(attempt, 10)) * (0.5 + Math.random() / 2);

/** A socket message as a wall event. Pongs, malformed and unknown messages come back undefined. */
export function parseWallEvent(data: unknown): WallEvent | undefined {
  if (typeof data !== "string" || data === "pong") return undefined;
  try {
    const parsed = wallEventSchema.safeParse(JSON.parse(data));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}
