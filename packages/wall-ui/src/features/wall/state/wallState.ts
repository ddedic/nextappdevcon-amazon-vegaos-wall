import type { PhotoDTO, WallPhotoEvent, WallSnapshotDTO, WallStatsDTO } from "@boothwall/shared";

import { POOL_LIMIT } from "../constants/feed";
import { SLOTS } from "../constants/layout";

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
  /**
   * Photos the director needs to stay where they are (the selection and a queued arrival):
   * rotation, arrivals and the remote never put another photo in their slots.
   */
  pinned: string[];
};

export type WallAction =
  | { type: "snapshot"; snapshot: WallSnapshotDTO }
  | { type: "event"; event: WallPhotoEvent }
  /** Swap one on-screen photo for a waiting one, never touching a pinned or fresh one. */
  | { type: "rotate" }
  /** Put a photo on screen (the remote browsed to it), in the slot `slotToShow` picks. */
  | { type: "show"; photoId: string }
  | { type: "pin"; ids: string[] }
  | { type: "settled"; photoId: string };

export const initialWallState: WallState = {
  pool: [],
  slots: Array<string | null>(SLOT_COUNT).fill(null),
  stats: { total: 0, byTribe: {} },
  fresh: [],
  pinned: [],
};

const createdAt = (pool: PhotoDTO[], id: string | null) =>
  pool.find((photo) => photo.id === id)?.createdAt ?? "";

/** The slot showing the oldest photo `spare` doesn't rule out, if any. */
const oldestSlot = (state: WallState, spare: (id: string) => boolean) =>
  state.slots
    .map((id, index) => ({ id, index }))
    .filter(({ id }) => id !== null && !spare(id))
    .reduce<{ id: string | null; index: number } | undefined>(
      (best, slot) =>
        !best || createdAt(state.pool, slot.id) < createdAt(state.pool, best.id) ? slot : best,
      undefined,
    )?.index;

/** Best slot for an incoming photo: an empty one, else the one showing the oldest unpinned photo. */
const slotFor = (state: WallState) => {
  const empty = state.slots.indexOf(null);
  if (empty !== -1) return empty;
  return (
    oldestSlot(state, (id) => state.pinned.includes(id)) ?? oldestSlot(state, () => false) ?? 0
  );
};

/**
 * Where a photo the remote browsed to appears: its own slot if it's on screen, else an empty
 * one, else the slot with the oldest photo that isn't pinned or a live arrival.
 */
export function slotToShow(state: WallState, photoId: string): number {
  const current = state.slots.indexOf(photoId);
  if (current !== -1) return current;
  const empty = state.slots.indexOf(null);
  if (empty !== -1) return empty;
  const spare = (id: string) => state.pinned.includes(id) || state.fresh.includes(id);
  return oldestSlot(state, spare) ?? 0;
}

const offscreen = (state: WallState) =>
  state.pool.filter((photo) => !state.slots.includes(photo.id));

const place = (slots: (string | null)[], index: number, id: string | null) =>
  slots.map((current, i) => (i === index ? id : current));

/**
 * Keeps an 8-hour booth from drifting: a slot whose photo fell out of the capped pool gets a
 * waiting one, and only photos still on screen keep the "new" treatment (a card replaced before
 * its badge settled would otherwise stay in `fresh` forever and never rotate out).
 */
function tidy(state: WallState): WallState {
  const inPool = new Set(state.pool.map((photo) => photo.id));
  let { slots } = state;
  if (slots.some((id) => id !== null && !inPool.has(id))) {
    const kept = slots.map((id) => (id !== null && inPool.has(id) ? id : null));
    const queue = state.pool.filter((photo) => !kept.includes(photo.id));
    slots = kept.map(
      (id, i) => id ?? (state.slots[i] === null ? null : (queue.shift()?.id ?? null)),
    );
  }
  const fresh = state.fresh.filter((id) => slots.includes(id));
  if (slots === state.slots && fresh.length === state.fresh.length) return state;
  return { ...state, slots, fresh };
}

export function wallReducer(state: WallState, action: WallAction): WallState {
  switch (action.type) {
    case "snapshot": {
      const pool = action.snapshot.photos.slice(0, POOL_LIMIT);
      // Keep photos that are still approved where they are; fill gaps with the newest.
      const kept = state.slots.map((id) => (pool.some((photo) => photo.id === id) ? id : null));
      const queue = pool.filter((photo) => !kept.includes(photo.id));
      const slots = kept.map((id) => id ?? queue.shift()?.id ?? null);
      return tidy({ ...state, pool, slots, stats: action.snapshot.stats });
    }

    case "event": {
      const { event } = action;
      if (event.type === "photo.created") {
        if (state.pool.some((photo) => photo.id === event.photo.id)) return state;
        const pool = [event.photo, ...state.pool].slice(0, POOL_LIMIT);
        const slots = place(state.slots, slotFor(state), event.photo.id);
        const fresh = [...state.fresh, event.photo.id];
        return tidy({ ...state, pool, slots, stats: event.stats, fresh });
      }
      if (event.type === "photo.updated") {
        // New caption or category, same photo: it stays in its slot and keeps its place.
        const pool = state.pool.map((photo) => (photo.id === event.photo.id ? event.photo : photo));
        return { ...state, pool, stats: event.stats };
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
        .filter(({ id }) => id !== null && !state.pinned.includes(id) && !state.fresh.includes(id));
      const incoming = waiting[Math.floor(Math.random() * waiting.length)];
      const target = candidates[Math.floor(Math.random() * candidates.length)];
      if (!incoming || !target) return state;
      return { ...state, slots: place(state.slots, target.index, incoming.id) };
    }

    case "show": {
      if (!state.pool.some((photo) => photo.id === action.photoId)) return state;
      const slot = slotToShow(state, action.photoId);
      return tidy({ ...state, slots: place(state.slots, slot, action.photoId) });
    }

    case "pin":
      return { ...state, pinned: action.ids };

    case "settled":
      return { ...state, fresh: state.fresh.filter((id) => id !== action.photoId) };
  }
}
