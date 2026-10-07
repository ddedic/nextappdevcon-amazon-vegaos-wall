import type { PhotoDTO, WallPhotoEvent, WallSnapshotDTO, WallStatsDTO } from "@vegaos-demo/shared";

import { POOL_LIMIT } from "@/features/wall/constants/feed";
import { SLOTS } from "@/features/wall/constants/layout";

/** How many polaroids float on screen at once (Fire TV Stick budget). */
export const SLOT_COUNT = SLOTS.length;

export type WallState = {
  /** Approved photos, newest first. */
  pool: PhotoDTO[];
  /** Photo id per on-screen slot. */
  slots: (string | null)[];
  stats: WallStatsDTO;
  /** Ids that arrived live and should get the "new" treatment. */
  fresh: string[];
};

export type WallAction =
  | { type: "snapshot"; snapshot: WallSnapshotDTO }
  | { type: "event"; event: WallPhotoEvent }
  /** Swap one on-screen photo for a waiting one, never touching `keep`. */
  | { type: "rotate"; keep: string[] }
  /** Put a waiting photo on screen (the remote browsed to it), in the slot `slotToShow` picked. */
  | { type: "show"; photoId: string; slot: number }
  | { type: "settled"; photoId: string };

export const initialWallState: WallState = {
  pool: [],
  slots: Array<string | null>(SLOT_COUNT).fill(null),
  stats: { total: 0, byTribe: {} },
  fresh: [],
};

const createdAt = (pool: PhotoDTO[], id: string | null) =>
  pool.find((photo) => photo.id === id)?.createdAt ?? "";

/** Best slot for an incoming photo: an empty one, else the one showing the oldest photo. */
const slotFor = (slots: (string | null)[], pool: PhotoDTO[]) => {
  const empty = slots.indexOf(null);
  if (empty !== -1) return empty;
  return slots.reduce(
    (oldest, id, index) =>
      createdAt(pool, id) < createdAt(pool, slots[oldest] ?? null) ? index : oldest,
    0,
  );
};

/**
 * Where a photo the remote browsed to appears: its own slot if it's on screen, else an empty
 * one, else the slot with the oldest photo that isn't protected by `keep` or a live arrival.
 */
export function slotToShow(state: WallState, photoId: string, keep: string[]): number {
  const current = state.slots.indexOf(photoId);
  if (current !== -1) return current;
  const empty = state.slots.indexOf(null);
  if (empty !== -1) return empty;
  const free = state.slots
    .map((id, index) => ({ id, index }))
    .filter(({ id }) => id !== null && !keep.includes(id) && !state.fresh.includes(id));
  const oldest = free.reduce<{ id: string | null; index: number } | undefined>(
    (best, slot) =>
      !best || createdAt(state.pool, slot.id) < createdAt(state.pool, best.id) ? slot : best,
    undefined,
  );
  return oldest?.index ?? 0;
}

const offscreen = (state: WallState) =>
  state.pool.filter((photo) => !state.slots.includes(photo.id));

const place = (slots: (string | null)[], index: number, id: string | null) =>
  slots.map((current, i) => (i === index ? id : current));

export function wallReducer(state: WallState, action: WallAction): WallState {
  switch (action.type) {
    case "snapshot": {
      const pool = action.snapshot.photos.slice(0, POOL_LIMIT);
      // Keep photos that are still approved where they are; fill gaps with the newest.
      const kept = state.slots.map((id) => (pool.some((photo) => photo.id === id) ? id : null));
      const queue = pool.filter((photo) => !kept.includes(photo.id));
      const slots = kept.map((id) => id ?? queue.shift()?.id ?? null);
      return { ...state, pool, slots, stats: action.snapshot.stats };
    }

    case "event": {
      const { event } = action;
      if (event.type === "photo.created") {
        if (state.pool.some((photo) => photo.id === event.photo.id)) return state;
        const pool = [event.photo, ...state.pool].slice(0, POOL_LIMIT);
        const slots = place(state.slots, slotFor(state.slots, state.pool), event.photo.id);
        return { pool, slots, stats: event.stats, fresh: [...state.fresh, event.photo.id] };
      }
      const pool = state.pool.filter((photo) => photo.id !== event.photoId);
      const index = state.slots.indexOf(event.photoId);
      const next = {
        ...state,
        pool,
        stats: event.stats,
        fresh: state.fresh.filter((id) => id !== event.photoId),
      };
      if (index === -1) return next;
      return { ...next, slots: place(state.slots, index, offscreen(next)[0]?.id ?? null) };
    }

    case "rotate": {
      // Keeps a busy wall moving: a random unprotected slot gets a photo waiting off-screen.
      const waiting = offscreen(state);
      const candidates = state.slots
        .map((id, index) => ({ id, index }))
        .filter(({ id }) => id !== null && !action.keep.includes(id) && !state.fresh.includes(id));
      const incoming = waiting[Math.floor(Math.random() * waiting.length)];
      const target = candidates[Math.floor(Math.random() * candidates.length)];
      if (!incoming || !target) return state;
      return { ...state, slots: place(state.slots, target.index, incoming.id) };
    }

    case "show":
      if (!state.pool.some((photo) => photo.id === action.photoId)) return state;
      return { ...state, slots: place(state.slots, action.slot, action.photoId) };

    case "settled":
      return { ...state, fresh: state.fresh.filter((id) => id !== action.photoId) };
  }
}
