import type { PhotoDTO } from "@boothwall/shared";
import { useCallback, useEffect, useState } from "react";

import { controlCopy } from "@/features/control/constants/copy";
import { QUEUE_REFRESH_MS } from "@/features/control/constants/timing";
import { approvePhoto, fetchPending, removePhoto } from "@/features/control/data/controlApi";
import type { ControlSession } from "@/features/control/hooks/useControlSession";

export type QueueAction = "approve" | "reject";

/** Photos waiting for approval, polled while the panel is unlocked. */
export function useQueue(
  { passcode, fail }: ControlSession,
  /** Page-wide error line: set while the queue can't be reached, cleared once it can. */
  onError: (message: string | null) => void,
) {
  const [pending, setPending] = useState<PhotoDTO[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<{ id: string; action: QueueAction } | null>(null);
  const [bulk, setBulk] = useState<{ done: number; total: number } | null>(null);

  const handle = useCallback(
    (err: unknown) => {
      if (!fail(err)) onError(controlCopy.loadFailed);
    },
    [fail, onError],
  );

  const refresh = useCallback(async () => {
    if (!passcode) return;
    try {
      setPending(await fetchPending(passcode));
      setLoaded(true);
      onError(null);
    } catch (err) {
      handle(err);
    }
  }, [handle, onError, passcode]);

  useEffect(() => {
    if (!passcode) return;
    void refresh();
    const timer = setInterval(() => void refresh(), QUEUE_REFRESH_MS);
    return () => clearInterval(timer);
  }, [passcode, refresh]);

  const act = useCallback(
    async (id: string, action: QueueAction) => {
      setBusy({ id, action });
      try {
        await (action === "approve" ? approvePhoto : removePhoto)(id, passcode);
        // Gone from the queue straight away; the next poll confirms it.
        setPending((current) => current.filter((photo) => photo.id !== id));
      } catch (err) {
        handle(err);
      } finally {
        setBusy(null);
      }
    },
    [handle, passcode],
  );

  /** Approves the whole queue one photo at a time, so the TV gets them in order. */
  const approveAll = useCallback(async () => {
    const queue = [...pending].reverse();
    setBulk({ done: 0, total: queue.length });
    try {
      for (const [index, photo] of queue.entries()) {
        await approvePhoto(photo.id, passcode);
        setBulk({ done: index + 1, total: queue.length });
      }
    } catch (err) {
      handle(err);
    } finally {
      setBulk(null);
      await refresh();
    }
  }, [handle, passcode, pending, refresh]);

  return {
    pending,
    loaded,
    busy,
    bulk,
    approve: (id: string) => act(id, "approve"),
    reject: (id: string) => act(id, "reject"),
    approveAll,
  };
}
