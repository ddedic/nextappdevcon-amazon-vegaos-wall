import type { PhotoDTO, RemoteCommand } from "@vegaos-demo/shared";
import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";

import {
  AUTO_OPEN_EVERY_MS,
  HURRY_MS,
  ROTATE_EVERY_MS,
  SELECT_DEBOUNCE_MS,
  SELECT_EVERY_MS,
} from "@/features/wall/constants/timing";
import {
  filledSlotsOf,
  initialDirectorState,
  wallDirector,
} from "@/features/wall/state/wallDirector";
import { slotToShow, type WallState } from "@/features/wall/state/wallState";

export type RemoteCommands = Record<RemoteCommand, () => void>;

type Options = {
  wall: WallState;
  rotate: (keep: string[]) => void;
  show: (photoId: string, slot: number) => void;
};

/** Owns the wall's timers and feeds them into the `wallDirector` reducer. */
export function useWallDirector({ wall, rotate, show }: Options) {
  const [state, dispatch] = useReducer(wallDirector, initialDirectorState);
  const { selectedSlot, cycle, paused, spotlight, nextUp } = state;
  const hurry = nextUp !== null;

  // Timers and remote commands read the latest wall without restarting.
  const slotsRef = useRef(wall.slots);
  const wallRef = useRef(wall);
  const directorRef = useRef(state);
  useEffect(() => {
    slotsRef.current = wall.slots;
    wallRef.current = wall;
    directorRef.current = state;
  }, [state, wall]);

  const filledSlots = useMemo(() => filledSlotsOf(wall.slots), [wall.slots]);
  const photoById = useCallback(
    (id: string | null): PhotoDTO | null => wall.pool.find((photo) => photo.id === id) ?? null,
    [wall.pool],
  );
  const selectedId = wall.slots[selectedSlot] ?? null;
  const selectedPhoto = useMemo(() => photoById(selectedId), [photoById, selectedId]);
  const nextUpPhoto = useMemo(() => photoById(nextUp), [nextUp, photoById]);

  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(
      () => dispatch({ type: "advance", slots: slotsRef.current }),
      hurry ? HURRY_MS : SELECT_EVERY_MS,
    );
    return () => clearTimeout(timer);
  }, [cycle, hurry, paused]);

  const hasPhotos = filledSlots.length > 0;
  useEffect(() => {
    if (!selectedId && hasPhotos) dispatch({ type: "selectionEmptied", slots: wall.slots });
  }, [hasPhotos, selectedId, wall.slots]);

  useEffect(() => {
    if (spotlight || paused || !hasPhotos) return;
    const timer = setTimeout(() => dispatch({ type: "autoOpen" }), AUTO_OPEN_EVERY_MS);
    return () => clearTimeout(timer);
  }, [hasPhotos, paused, spotlight]);

  useEffect(() => {
    if (paused) return;
    const keep = [selectedId, nextUp].filter((id): id is string => id !== null);
    const timer = setInterval(() => rotate(keep), ROTATE_EVERY_MS);
    return () => clearInterval(timer);
  }, [nextUp, paused, rotate, selectedId]);

  const newest = wall.fresh[wall.fresh.length - 1];
  useEffect(() => {
    if (newest) dispatch({ type: "arrival", photoId: newest });
  }, [newest]);

  const hasSelection = selectedPhoto !== null;
  const hasSelectionRef = useRef(hasSelection);
  useEffect(() => {
    hasSelectionRef.current = hasSelection;
  }, [hasSelection]);

  // The remote walks every approved photo, newest first, not just the ones on screen: a
  // waiting photo is swapped into a slot as you reach it.
  const browse = useCallback(
    (direction: 1 | -1) => {
      const current = wallRef.current;
      const { selectedSlot: slot, nextUp: queued } = directorRef.current;
      const selected = current.slots[slot] ?? null;
      const { pool } = current;
      if (pool.length === 0) return;
      const index = pool.findIndex((photo) => photo.id === selected);
      const target = pool[(index + direction + pool.length) % pool.length];
      if (!target) return;
      const keep = [selected, queued].filter((id): id is string => id !== null);
      const targetSlot = slotToShow(current, target.id, keep);
      show(target.id, targetSlot);
      dispatch({ type: "select", slot: targetSlot });
    },
    [show],
  );

  const lastSelect = useRef(0);
  const commands = useMemo<RemoteCommands>(
    () => ({
      select: () => {
        if (!hasSelectionRef.current) return;
        const now = Date.now();
        if (now - lastSelect.current < SELECT_DEBOUNCE_MS) return;
        lastSelect.current = now;
        dispatch({ type: "toggleSpotlight" });
      },
      right: () => browse(1),
      left: () => browse(-1),
      back: () => dispatch({ type: "closeSpotlight" }),
      playpause: () => dispatch({ type: "togglePause" }),
    }),
    [browse],
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
