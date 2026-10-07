export type Slots = readonly (string | null)[];

export type DirectorState = {
  selectedSlot: number;
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
  /** The remote browsed to a photo that now sits in `slot`. */
  | { type: "select"; slot: number }
  | { type: "toggleSpotlight" }
  | { type: "closeSpotlight" }
  | { type: "togglePause" }
  | { type: "selectionEmptied"; slots: Slots };

export const initialDirectorState: DirectorState = {
  selectedSlot: 0,
  cycle: 0,
  paused: false,
  spotlight: false,
  autoSpotlight: false,
  nextUp: null,
};

export const filledSlotsOf = (slots: Slots) => slots.flatMap((id, index) => (id ? [index] : []));

function move(state: DirectorState, direction: 1 | -1, slots: Slots): DirectorState {
  const filled = filledSlotsOf(slots);
  if (filled.length === 0) return state;
  const current = filled.indexOf(state.selectedSlot);
  const next = filled[(current + direction + filled.length) % filled.length];
  return {
    ...state,
    selectedSlot: next ?? state.selectedSlot,
    cycle: state.cycle + 1,
  };
}

export function wallDirector(state: DirectorState, event: DirectorEvent): DirectorState {
  switch (event.type) {
    case "advance": {
      const queued = state.nextUp ? event.slots.indexOf(state.nextUp) : -1;
      const next = { ...state, nextUp: null };
      if (queued !== -1) {
        // Show the arrival; open it full screen unless the spotlight is already open.
        return {
          ...next,
          selectedSlot: queued,
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
      return { ...state, selectedSlot: event.slot, cycle: state.cycle + 1 };

    case "toggleSpotlight":
      return { ...state, spotlight: !state.spotlight, autoSpotlight: false };

    case "closeSpotlight":
      if (!state.spotlight && !state.autoSpotlight) return state;
      return { ...state, spotlight: false, autoSpotlight: false };

    case "togglePause":
      return { ...state, paused: !state.paused, cycle: state.cycle + 1 };

    case "selectionEmptied":
      if (event.slots[state.selectedSlot]) return state;
      return move(state, 1, event.slots);
  }
}
