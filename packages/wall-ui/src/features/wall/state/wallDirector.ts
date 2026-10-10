export type Slots = readonly (string | null)[];

export type DirectorState = {
  /**
   * The selected photo. Kept by id, not slot: whatever happens to the slots, the remote and the
   * countdown carry on from the photo the viewer is looking at.
   */
  selectedId: string | null;
  /** Bumped whenever the current photo's countdown restarts. */
  cycle: number;
  paused: boolean;
  spotlight: boolean;
  /** The spotlight was opened by the wall itself and closes after one cycle. */
  autoSpotlight: boolean;
  /** A live arrival waiting for the current photo to finish. */
  nextUp: string | null;
};

export type DirectorEvent =
  | { type: "advance"; slots: Slots }
  | { type: "autoOpen" }
  | { type: "arrival"; photoId: string }
  | { type: "move"; direction: 1 | -1; slots: Slots }
  /** The remote browsed to a photo (the wall puts it on screen). */
  | { type: "select"; photoId: string }
  | { type: "toggleSpotlight" }
  | { type: "closeSpotlight" }
  | { type: "togglePause" }
  /** The selected photo left the wall (or nothing is selected yet); `slot` is where it was. */
  | { type: "selectionEmptied"; slots: Slots; slot: number };

export const initialDirectorState: DirectorState = {
  selectedId: null,
  cycle: 0,
  paused: false,
  spotlight: false,
  autoSpotlight: false,
  nextUp: null,
};

export const filledSlotsOf = (slots: Slots) => slots.flatMap((id, index) => (id ? [index] : []));

/** The photos the wall must keep in place: the selection and a queued arrival. */
export const pinnedIds = (state: DirectorState) =>
  [state.selectedId, state.nextUp].filter((id): id is string => id !== null);

/** The photo next to `selectedId` among all approved ones (newest first), wrapping around. */
export function browseTarget(
  pool: readonly { id: string }[],
  selectedId: string | null,
  direction: 1 | -1,
): string | null {
  if (pool.length === 0) return null;
  const index = pool.findIndex((photo) => photo.id === selectedId);
  // Nothing selected (or it just left the pool): start from the matching end.
  if (index === -1) return (direction === 1 ? pool[0] : pool[pool.length - 1])?.id ?? null;
  return pool[(index + direction + pool.length) % pool.length]?.id ?? null;
}

/** Selects the photo in the first filled slot from `from`, stepping by `direction`. */
function selectFrom(
  state: DirectorState,
  from: number,
  direction: 1 | -1,
  slots: Slots,
): DirectorState {
  const count = slots.length;
  for (let step = 0; step < count; step++) {
    const id = slots[(((from + step * direction) % count) + count) % count];
    if (id) return { ...state, selectedId: id, cycle: state.cycle + 1 };
  }
  return state;
}

function move(state: DirectorState, direction: 1 | -1, slots: Slots): DirectorState {
  const current = state.selectedId === null ? -1 : slots.indexOf(state.selectedId);
  const from = current === -1 ? 0 : current + direction;
  return selectFrom(state, from, direction, slots);
}

export function wallDirector(state: DirectorState, event: DirectorEvent): DirectorState {
  switch (event.type) {
    case "advance": {
      const queued = state.nextUp !== null && event.slots.includes(state.nextUp);
      const next = { ...state, nextUp: null };
      if (queued) {
        // Show the arrival; open it full screen unless the spotlight is already open.
        return {
          ...next,
          selectedId: state.nextUp,
          cycle: state.cycle + 1,
          spotlight: true,
          autoSpotlight: state.spotlight ? state.autoSpotlight : true,
        };
      }
      if (state.autoSpotlight) {
        return move({ ...next, spotlight: false, autoSpotlight: false }, 1, event.slots);
      }
      return move(next, 1, event.slots);
    }

    case "autoOpen":
      if (state.spotlight || state.paused) return state;
      return { ...state, spotlight: true, autoSpotlight: true, cycle: state.cycle + 1 };

    case "arrival":
      return { ...state, nextUp: event.photoId };

    case "move":
      return move(state, event.direction, event.slots);

    case "select":
      return { ...state, selectedId: event.photoId, cycle: state.cycle + 1 };

    case "toggleSpotlight":
      return { ...state, spotlight: !state.spotlight, autoSpotlight: false };

    case "closeSpotlight":
      if (!state.spotlight && !state.autoSpotlight) return state;
      return { ...state, spotlight: false, autoSpotlight: false };

    case "togglePause":
      return { ...state, paused: !state.paused, cycle: state.cycle + 1 };

    case "selectionEmptied":
      if (state.selectedId !== null && event.slots.includes(state.selectedId)) return state;
      // Whatever took its place, else the next photo along.
      return selectFrom(state, event.slot, 1, event.slots);
  }
}
