export type FeedStatus = "connecting" | "live" | "offline" | "simulated";

export type ConnectionPhase = "connecting" | "loading" | "failed" | "ready";

/** What the start-up overlay shows. Once the first snapshot is in, later drops only touch the status pill. */
export function connectionPhase(status: FeedStatus, loaded: boolean): ConnectionPhase {
  if (loaded || status === "simulated") return "ready";
  if (status === "offline") return "failed";
  if (status === "live") return "loading";
  return "connecting";
}
