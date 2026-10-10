import type { PhotoDTO, RemoteCommand } from "@boothwall/shared";
import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";

import {
  AUTO_OPEN_EVERY_MS,
  HURRY_MS,
  PREFETCH_LEAD_MS,
  ROTATE_EVERY_MS,
  SELECT_DEBOUNCE_MS,
  SELECT_EVERY_MS,
} from "../constants/timing";
import { prefetchImage } from "../data/prefetchImage";
import {
  browseTarget,
  type DirectorEvent,
  filledSlotsOf,
  initialDirectorState,
  pinnedIds,
  wallDirector,
} from "../state/wallDirector";
import type { WallState } from "../state/wallState";

export type RemoteCommands = Record<RemoteCommand, () => void>;

type Options = {
  wall: WallState;
  rotate: () => void;
  show: (photoId: string) => void;
  /** Tells the wall which photos must stay put (see `WallState.pinned`). */
  pin: (ids: string[]) => void;
};

/** Owns the wall's timers and feeds them into the `wallDirector` reducer. */
export function useWallDirector({ wall, rotate, show, pin }: Options) {
  const [state, dispatch] = useReducer(wallDirector, initialDirectorState);
  const { selectedId, cycle, paused, spotlight, autoSpotlight, nextUp } = state;
  const hurry = nextUp !== null;

  // Timers and remote commands read the latest wall without restarting.
  const wallRef = useRef(wall);
  useEffect(() => {
    wallRef.current = wall;
  }, [wall]);

  // The director's state as of the last event, not the last render: a second press (or a
  // timer) before React commits must carry on from the first one, and the wall must pin the
  // new selection before a rotation or an arrival can land on it.
  const directorRef = useRef(state);
  const pinnedRef = useRef("");
  const send = useCallback(
    (event: DirectorEvent) => {
      directorRef.current = wallDirector(directorRef.current, event);
      dispatch(event);
      const ids = pinnedIds(directorRef.current);
      if (ids.join() === pinnedRef.current) return;
      pinnedRef.current = ids.join();
      pin(ids);
    },
    [pin],
  );

  const filledSlots = useMemo(() => filledSlotsOf(wall.slots), [wall.slots]);
  const photoById = useCallback(
    (id: string | null): PhotoDTO | null => wall.pool.find((photo) => photo.id === id) ?? null,
    [wall.pool],
  );
  const selectedSlot = selectedId === null ? -1 : wall.slots.indexOf(selectedId);
  const selectedPhoto = useMemo(() => photoById(selectedId), [photoById, selectedId]);
  const nextUpPhoto = useMemo(() => photoById(nextUp), [nextUp, photoById]);

  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(
      () => send({ type: "advance", slots: wallRef.current.slots }),
      hurry ? HURRY_MS : SELECT_EVERY_MS,
    );
    return () => clearTimeout(timer);
  }, [cycle, hurry, paused, send]);

  // Where the selection was last seen, so a removed photo hands over to whatever replaced it.
  const lastSlot = useRef(0);
  useEffect(() => {
    if (selectedSlot !== -1) lastSlot.current = selectedSlot;
  }, [selectedSlot]);

  const hasPhotos = filledSlots.length > 0;
  useEffect(() => {
    if (selectedSlot === -1 && hasPhotos) {
      send({ type: "selectionEmptied", slots: wall.slots, slot: lastSlot.current });
    }
  }, [hasPhotos, selectedSlot, send, wall.slots]);

  useEffect(() => {
    if (spotlight || paused || !hasPhotos) return;
    // Warm the full-size image of whatever is selected just before it opens full screen.
    const warm = setTimeout(() => {
      const id = directorRef.current.selectedId;
      prefetchImage(wallRef.current.pool.find((photo) => photo.id === id)?.imageUrl);
    }, AUTO_OPEN_EVERY_MS - PREFETCH_LEAD_MS);
    const timer = setTimeout(() => send({ type: "autoOpen" }), AUTO_OPEN_EVERY_MS);
    return () => {
      clearTimeout(warm);
      clearTimeout(timer);
    };
  }, [hasPhotos, paused, send, spotlight]);

  // The next photo opens full screen when an arrival is queued or the viewer's slideshow is
  // running: fetch its full image during the current photo's turn.
  const slideshow = spotlight && !autoSpotlight;
  const upcomingSlot = filledSlots[(filledSlots.indexOf(selectedSlot) + 1) % filledSlots.length];
  const upcomingId =
    nextUp ?? (slideshow && upcomingSlot !== undefined ? (wall.slots[upcomingSlot] ?? null) : null);
  const upcomingUrl = photoById(upcomingId)?.imageUrl;
  useEffect(() => {
    prefetchImage(upcomingUrl);
  }, [upcomingUrl]);

  // The wall spares pinned photos itself, so the ticks never need restarting.
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(rotate, ROTATE_EVERY_MS);
    return () => clearInterval(timer);
  }, [paused, rotate]);

  const newest = wall.fresh[wall.fresh.length - 1];
  useEffect(() => {
    if (newest) send({ type: "arrival", photoId: newest });
  }, [newest, send]);

  const hasSelection = selectedPhoto !== null;
  const hasSelectionRef = useRef(hasSelection);
  useEffect(() => {
    hasSelectionRef.current = hasSelection;
  }, [hasSelection]);

  // The remote walks every approved photo, newest first, not just the ones on screen: a
  // waiting photo is swapped into a slot as you reach it (never the one you came from, which
  // is still pinned when the wall picks the slot).
  const browse = useCallback(
    (direction: 1 | -1) => {
      const target = browseTarget(wallRef.current.pool, directorRef.current.selectedId, direction);
      if (target === null) return;
      show(target);
      send({ type: "select", photoId: target });
    },
    [send, show],
  );

  const lastSelect = useRef(0);
  const commands = useMemo<RemoteCommands>(
    () => ({
      select: () => {
        if (!hasSelectionRef.current) return;
        const now = Date.now();
        if (now - lastSelect.current < SELECT_DEBOUNCE_MS) return;
        lastSelect.current = now;
        send({ type: "toggleSpotlight" });
      },
      right: () => browse(1),
      left: () => browse(-1),
      back: () => send({ type: "closeSpotlight" }),
      playpause: () => send({ type: "togglePause" }),
    }),
    [browse, send],
  );

  const poolIndex = wall.pool.findIndex((photo) => photo.id === selectedId);

  return {
    selectedSlot,
    selectedPhoto,
    nextUpPhoto,
    filledSlots,
    /** Place of the selected photo among all approved ones (newest is 1). */
    position: poolIndex + 1,
    total: wall.pool.length,
    spotlight,
    paused,
    durationMs: hurry ? HURRY_MS : SELECT_EVERY_MS,
    cycleKey: `${cycle}-${selectedId}`,
    commands,
  };
}
