import { type WallSnapshotDTO, wallSnapshotSchema } from "@boothwall/shared";

import { appConfig } from "../../../app/app.config";
import { POOL_LIMIT } from "../constants/feed";

/**
 * Rejects on a timeout, any non-2xx status (5xx included), unreadable JSON or a body that
 * doesn't match the contract; the caller retries with backoff.
 */
export async function fetchWall(): Promise<WallSnapshotDTO> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  // The race is a backstop in case the platform fetch ignores the abort signal.
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error(`GET /photos timed out after ${appConfig.requestTimeoutMs} ms`));
    }, appConfig.requestTimeoutMs);
  });
  const request = (async () => {
    const res = await fetch(`${appConfig.apiBaseUrl}/photos?limit=${POOL_LIMIT}`, {
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`GET /photos failed with ${res.status}`);
    return wallSnapshotSchema.parse(await res.json());
  })();
  try {
    return await Promise.race([request, timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    // The losing side must not surface as an unhandled rejection.
    request.catch(() => undefined);
  }
}
