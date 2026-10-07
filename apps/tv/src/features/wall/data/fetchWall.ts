import { type WallSnapshotDTO, wallSnapshotSchema } from "@vegaos-demo/shared";

import { appConfig } from "@/app/app.config";
import { POOL_LIMIT } from "@/features/wall/constants/feed";

export async function fetchWall(): Promise<WallSnapshotDTO> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), appConfig.requestTimeoutMs);
  try {
    const res = await fetch(`${appConfig.apiBaseUrl}/photos?limit=${POOL_LIMIT}`, {
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`GET /photos failed with ${res.status}`);
    return wallSnapshotSchema.parse(await res.json());
  } finally {
    clearTimeout(timer);
  }
}
