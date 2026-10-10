import {
  type DirectorState,
  initialDirectorState,
  pinnedIds,
  type Slots,
  wallDirector,
} from "./wallDirector";

const slots: Slots = ["a", null, "b", "c"];
const state = (patch: Partial<DirectorState> = {}): DirectorState => ({
  ...initialDirectorState,
  ...patch,
});

describe("wallDirector", () => {
  it("advances to the next filled slot and wraps around, skipping empty ones", () => {
    const first = wallDirector(state({ selectedId: "a" }), { type: "advance", slots });
    expect(first).toMatchObject({ selectedId: "b", cycle: 1 });

    const wrapped = wallDirector(state({ selectedId: "c" }), { type: "advance", slots });
    expect(wrapped.selectedId).toBe("a");

    const back = wallDirector(state({ selectedId: "a" }), {
      type: "move",
      direction: -1,
      slots,
    });
    expect(back).toMatchObject({ selectedId: "c", cycle: 1 });
  });

  it("queues an arrival, then selects it and opens the spotlight in auto mode", () => {
    const queued = wallDirector(state({ selectedId: "a" }), { type: "arrival", photoId: "c" });
    expect(queued).toMatchObject({ nextUp: "c", selectedId: "a", spotlight: false });
    expect(pinnedIds(queued)).toEqual(["a", "c"]);

    const shown = wallDirector(queued, { type: "advance", slots });
    expect(shown).toMatchObject({
      nextUp: null,
      selectedId: "c",
      cycle: 1,
      spotlight: true,
      autoSpotlight: true,
    });

    const after = wallDirector(shown, { type: "advance", slots });
    expect(after).toMatchObject({ selectedId: "a", spotlight: false, autoSpotlight: false });
  });

  it("keeps a spotlight the viewer opened when an arrival takes its turn", () => {
    const open = state({ spotlight: true, nextUp: "b" });
    const next = wallDirector(open, { type: "advance", slots });
    expect(next).toMatchObject({ selectedId: "b", spotlight: true, autoSpotlight: false });

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

  it("follows the selected photo by id, wherever its slot goes", () => {
    const picked = wallDirector(state({ selectedId: "a" }), { type: "select", photoId: "c" });
    expect(picked).toMatchObject({ selectedId: "c", cycle: 1 });
    // Shuffled slots: advancing still starts from the selected photo.
    expect(wallDirector(picked, { type: "advance", slots: ["c", "a", null, "b"] }).selectedId).toBe(
      "a",
    );
  });

  it("hands over to the photo that took the selection's slot, and stays put on an empty wall", () => {
    const replaced = wallDirector(state({ selectedId: "gone" }), {
      type: "selectionEmptied",
      slots,
      slot: 2,
    });
    expect(replaced).toMatchObject({ selectedId: "b", cycle: 1 });

    const next = wallDirector(state({ selectedId: "gone" }), {
      type: "selectionEmptied",
      slots,
      slot: 1,
    });
    expect(next.selectedId).toBe("b");

    const still = state({ selectedId: "a" });
    expect(wallDirector(still, { type: "selectionEmptied", slots, slot: 0 })).toBe(still);

    const empty = state();
    expect(wallDirector(empty, { type: "advance", slots: [null, null] })).toEqual(empty);
  });
});
