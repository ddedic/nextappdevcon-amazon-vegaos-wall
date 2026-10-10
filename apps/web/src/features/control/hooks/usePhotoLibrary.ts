import type { PhotoDTO, PhotoSort, PhotoStatus, Tribe } from "@boothwall/shared";
import { useCallback, useEffect, useMemo, useState } from "react";

import { controlCopy } from "@/features/control/constants/copy";
import {
  approvePhoto,
  fetchPhotos,
  removePhoto,
  updatePhoto,
} from "@/features/control/data/controlApi";
import type { ControlSession } from "@/features/control/hooks/useControlSession";

const PAGE_SIZE = 24;

export type PhotoFilters = {
  status?: PhotoStatus;
  tribe?: Tribe;
  /** Caption search, already debounced. */
  q: string;
  sort: PhotoSort;
};

export type BulkAction = "hide" | "show" | "delete";

export type BulkProgress = { action: BulkAction; done: number; total: number };

export type PhotoEdit = { caption: string; tribe: Tribe };

type Page = {
  /** The filters these photos were loaded for; differs from the current ones while loading. */
  key: string;
  photos: PhotoDTO[];
  cursor: string | null;
  failed: boolean;
};

const EMPTY_PAGE: Page = { key: "", photos: [], cursor: null, failed: false };

const withStatus = (photo: PhotoDTO, status: PhotoStatus): PhotoDTO => ({ ...photo, status });

/** Puts a photo on the wall: approves a pending one, shows a hidden one. */
const putOnWall = (photo: PhotoDTO, passcode: string) =>
  photo.status === "pending"
    ? approvePhoto(photo.id, passcode)
    : updatePhoto(photo.id, { hidden: false }, passcode);

/**
 * The Control panel's photo list: filtered and paged by the API, edited optimistically here.
 * Hide, show, approve and edits show at once and roll back if the API says no; deletes wait
 * for the API, since they can't be undone.
 */
export function usePhotoLibrary({ passcode, fail, notify }: ControlSession, filters: PhotoFilters) {
  const { status, tribe, q, sort } = filters;
  const query = useMemo(
    () => ({ status, tribe, q: q.trim() || undefined, sort, limit: PAGE_SIZE }),
    [q, sort, status, tribe],
  );
  const key = JSON.stringify(query);

  const [page, setPage] = useState<Page>(EMPTY_PAGE);
  const [reload, setReload] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreFailed, setMoreFailed] = useState(false);
  const [busy, setBusy] = useState<ReadonlySet<string>>(new Set());
  const [bulk, setBulk] = useState<BulkProgress | null>(null);

  useEffect(() => {
    if (!passcode) return;
    let cancelled = false;
    fetchPhotos(query, passcode)
      .then(({ photos, nextCursor }) => {
        if (!cancelled) setPage({ key, photos, cursor: nextCursor, failed: false });
      })
      .catch((err: unknown) => {
        if (!cancelled && !fail(err)) setPage((current) => ({ ...current, key, failed: true }));
      })
      .finally(() => {
        if (!cancelled) setRefreshing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fail, key, passcode, query, reload]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    setMoreFailed(false);
    setReload((n) => n + 1);
  }, []);

  const retry = useCallback(() => {
    setPage((current) => ({ ...current, key: "", failed: false }));
    setReload((n) => n + 1);
  }, []);

  const loadMore = useCallback(async () => {
    if (!page.cursor || loadingMore || page.key !== key) return;
    setLoadingMore(true);
    try {
      const next = await fetchPhotos({ ...query, cursor: page.cursor }, passcode);
      setPage((current) => {
        if (current.key !== key) return current;
        const seen = new Set(current.photos.map((photo) => photo.id));
        const fresh = next.photos.filter((photo) => !seen.has(photo.id));
        return { ...current, photos: [...current.photos, ...fresh], cursor: next.nextCursor };
      });
      setMoreFailed(false);
    } catch (err) {
      if (!fail(err)) setMoreFailed(true);
    } finally {
      setLoadingMore(false);
    }
  }, [fail, key, loadingMore, page.cursor, page.key, passcode, query]);

  const replace = useCallback((next: PhotoDTO) => {
    setPage((current) => ({
      ...current,
      photos: current.photos.map((photo) => (photo.id === next.id ? next : photo)),
    }));
  }, []);

  const drop = useCallback((ids: ReadonlySet<string>) => {
    setPage((current) => ({
      ...current,
      photos: current.photos.filter((photo) => !ids.has(photo.id)),
    }));
  }, []);

  const track = useCallback((id: string, on: boolean) => {
    setBusy((current) => {
      const next = new Set(current);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  /** Shows `optimistic` now, then the API's version, or rolls back to `photo` on failure. */
  const optimistic = useCallback(
    async (photo: PhotoDTO, preview: PhotoDTO, send: () => Promise<PhotoDTO>) => {
      replace(preview);
      track(photo.id, true);
      try {
        const saved = await send();
        replace(saved);
        return saved;
      } catch (err) {
        replace(photo);
        if (!fail(err)) notify(controlCopy.toast.failed);
        return null;
      } finally {
        track(photo.id, false);
      }
    },
    [fail, notify, replace, track],
  );

  const setHidden = useCallback(
    async (photo: PhotoDTO, hidden: boolean, offerUndo = true): Promise<void> => {
      const saved = await optimistic(photo, withStatus(photo, hidden ? "hidden" : "approved"), () =>
        updatePhoto(photo.id, { hidden }, passcode),
      );
      if (!saved) return;
      notify(
        hidden ? controlCopy.toast.hidden : controlCopy.toast.shown,
        offerUndo
          ? { label: controlCopy.toast.undo, run: () => void setHidden(saved, !hidden, false) }
          : undefined,
      );
    },
    [notify, optimistic, passcode],
  );

  const approve = useCallback(
    async (photo: PhotoDTO) => {
      const saved = await optimistic(photo, withStatus(photo, "approved"), () =>
        approvePhoto(photo.id, passcode),
      );
      if (saved) notify(controlCopy.toast.approved);
    },
    [notify, optimistic, passcode],
  );

  /** Resolves true once saved, so the edit sheet can close. */
  const edit = useCallback(
    async (photo: PhotoDTO, { caption, tribe: nextTribe }: PhotoEdit) => {
      const preview = { ...photo, caption: caption.trim() || null, tribe: nextTribe };
      const saved = await optimistic(photo, preview, () =>
        updatePhoto(photo.id, { caption, tribe: nextTribe }, passcode),
      );
      if (saved) notify(controlCopy.toast.saved);
      return saved !== null;
    },
    [notify, optimistic, passcode],
  );

  const remove = useCallback(
    async (photo: PhotoDTO) => {
      track(photo.id, true);
      try {
        await removePhoto(photo.id, passcode);
        drop(new Set([photo.id]));
        notify(controlCopy.toast.deleted);
        return true;
      } catch (err) {
        if (!fail(err)) notify(controlCopy.toast.failed);
        return false;
      } finally {
        track(photo.id, false);
      }
    },
    [drop, fail, notify, passcode, track],
  );

  /** One photo at a time, so progress is honest and a failure stops the rest. */
  const runBulk = useCallback(
    async (action: BulkAction, selection: PhotoDTO[]) => {
      const todo = selection.filter((photo) =>
        action === "hide"
          ? photo.status !== "hidden"
          : action === "show"
            ? photo.status !== "approved"
            : true,
      );
      setBulk({ action, done: 0, total: todo.length });
      let done = 0;
      try {
        for (const photo of todo) {
          if (action === "delete") {
            await removePhoto(photo.id, passcode);
            drop(new Set([photo.id]));
          } else {
            replace(
              await (action === "hide"
                ? updatePhoto(photo.id, { hidden: true }, passcode)
                : putOnWall(photo, passcode)),
            );
          }
          done += 1;
          setBulk({ action, done, total: todo.length });
        }
        notify(controlCopy.bulk.done[action](done));
        return true;
      } catch (err) {
        if (!fail(err)) notify(controlCopy.bulk.failed(done, todo.length));
        return false;
      } finally {
        setBulk(null);
      }
    },
    [drop, fail, notify, passcode, replace],
  );

  const loading = page.key !== key;
  return {
    photos: page.photos,
    /** First load for these filters; the previous results stay up, dimmed, meanwhile. */
    loading,
    failed: !loading && page.failed,
    refreshing,
    hasMore: !loading && page.cursor !== null,
    loadingMore,
    moreFailed,
    busy,
    bulk,
    refresh,
    retry,
    loadMore,
    setHidden,
    approve,
    edit,
    remove,
    runBulk,
  };
}
