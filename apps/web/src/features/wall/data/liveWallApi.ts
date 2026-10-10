import { type WallSnapshotDTO, wallSnapshotSchema } from "@boothwall/shared";

import { LIVE_FEED_LIMIT } from "@/features/wall/constants/feed";
import { apiFetch } from "@/lib/api";

/** The newest approved photos and the category counts. */
export async function fetchWallSnapshot(): Promise<WallSnapshotDTO> {
  const res = await apiFetch(`/photos?limit=${LIVE_FEED_LIMIT}`);
  return wallSnapshotSchema.parse(await res.json());
}
