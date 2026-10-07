import { type DirectorState, initialDirectorState, type Slots, wallDirector } from "./wallDirector";

const slots: Slots = ["a", null, "b", "c"];
const state = (patch: Partial<DirectorState> = {}): DirectorState => ({
  ...initialDirectorState,
  ...patch,
});

describe("wallDirector", () => {
  it("advances to the next filled slot and wraps around, skipping empty ones", () => {
    const first = wallDirector(state(), { type: "advance", slots });
    expect(first).toMatchObject({ selectedSlot: 2, cycle: 1 });

    const wrapped = wallDirector(state({ selectedSlot: 3 }), { type: "advance", slots });
    expect(wrapped.selectedSlot).toBe(0);

    const back = wallDirector(state(), { type: "move", direction: -1, slots });
    expect(back).toMatchObject({ selectedSlot: 3, cycle: 1 });
  });

  it("queues an arrival, then selects it and opens the spotlight in auto mode", () => {
    const queued = wallDirector(state(), { type: "arrival", photoId: "c" });
    expect(queued).toMatchObject({ nextUp: "c", selectedSlot: 0, spotlight: false });

    const shown = wallDirector(queued, { type: "advance", slots });
    expect(shown).toMatchObject({
      nextUp: null,
      selectedSlot: 3,
      cycle: 1,
      spotlight: true,
      autoSpotlight: true,
    });

    const after = wallDirector(shown, { type: "advance", slots });
    expect(after).toMatchObject({ selectedSlot: 0, spotlight: false, autoSpotlight: false });
  });

  it("keeps a spotlight the viewer opened when an arrival takes its turn", () => {
    const open = state({ spotlight: true, nextUp: "b" });
    const next = wallDirector(open, { type: "advance", slots });
    expect(next).toMatchObject({ selectedSlot: 2, spotlight: true, autoSpotlight: false });

    // A slideshow the viewer opened keeps going.
    expect(wallDirector(next, { type: "advance", slots }).spotlight).toBe(true);
  });

  it("auto-opens only while closed and running, and the remote takes over auto mode", () => {
    const opened = wallDirector(state(), { type: "autoOpen" });
    expect(opened).toMatchObject({ spotlight: true, autoSpotlight: true, cycle: 1 });

    const paused = state({ paused: true });
    expect(wallDirector(paused, { type: "autoOpen" })).toBe(paused);

    const viewerOwned = wallDirector(opened, { type: "toggleSpotlight" });
    expect(viewerOwned).toMatchObject({ spotlight: false, autoSpotlight: false });
    expect(wallDirector(opened, { type: "closeSpotlight" })).toMatchObject({
      spotlight: false,
      autoSpotlight: false,
    });
  });

  it("restarts the countdown when pausing or resuming", () => {
    const paused = wallDirector(state({ cycle: 4 }), { type: "togglePause" });
    expect(paused).toMatchObject({ paused: true, cycle: 5 });
    expect(wallDirector(paused, { type: "togglePause" })).toMatchObject({
      paused: false,
      cycle: 6,
    });
  });

  it("moves on when the selected slot empties, and stays put on an empty wall", () => {
    const moved = wallDirector(state({ selectedSlot: 1 }), { type: "selectionEmptied", slots });
    expect(moved).toMatchObject({ selectedSlot: 0, cycle: 1 });

    const empty = state();
    expect(wallDirector(empty, { type: "advance", slots: [null, null] })).toEqual(empty);
  });
});
