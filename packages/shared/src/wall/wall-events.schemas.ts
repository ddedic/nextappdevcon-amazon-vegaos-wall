import { z } from "zod";

import { photoSchema, wallStatsSchema } from "./photo.schemas";

/** Buttons the phone remote can press on every connected wall. */
export const remoteCommandSchema = z.enum(["left", "right", "select", "back", "playpause"]);

export type RemoteCommand = z.infer<typeof remoteCommandSchema>;

/** Messages pushed to every connected wall over the realtime socket. */
export const wallEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("photo.created"), photo: photoSchema, stats: wallStatsSchema }),
  z.object({ type: z.literal("photo.removed"), photoId: z.string(), stats: wallStatsSchema }),
  /** A photo on the wall got a new caption or category; it keeps its place. */
  z.object({ type: z.literal("photo.updated"), photo: photoSchema, stats: wallStatsSchema }),
  z.object({ type: z.literal("remote.command"), command: remoteCommandSchema }),
]);

export type WallEvent = z.infer<typeof wallEventSchema>;

/** Events that change what's on the wall (everything except remote commands). */
export type WallPhotoEvent = Exclude<WallEvent, { type: "remote.command" }>;
