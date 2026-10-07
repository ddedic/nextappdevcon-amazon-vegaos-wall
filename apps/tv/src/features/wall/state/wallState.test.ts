import type { PhotoDTO } from "@vegaos-demo/shared";

import { initialWallState, SLOT_COUNT, slotToShow, wallReducer } from "./wallState";

const photo = (n: number): PhotoDTO => ({
  id: `p${n}`,
  status: "approved",
  caption: null,
  tribe: "reactcon",
  imageUrl: `https://api.test/photos/p${n}/image`,
  createdAt: new Date(Date.UTC(2026, 9, 7, 12, 0, n)).toISOString(),
});

const stats = { total: 0, byTribe: {} };

describe("wallReducer", () => {
  it("puts a live photo into the slot of the oldest one when the wall is full", () => {
    const photos = Array.from({ length: SLOT_COUNT }, (_, i) => photo(SLOT_COUNT - i)); // newest first
    let state = wallReducer(initialWallState, { type: "snapshot", snapshot: { photos, stats } });
    const oldestSlot = state.slots.indexOf("p1");

    state = wallReducer(state, {
      type: "event",
      event: { type: "photo.created", photo: photo(99), stats },
    });

    expect(state.slots[oldestSlot]).toBe("p99");
    expect(state.fresh).toEqual(["p99"]);
  });

  it("refills a removed photo's slot from photos waiting off-screen", () => {
    const photos = Array.from({ length: SLOT_COUNT + 1 }, (_, i) => photo(SLOT_COUNT + 1 - i));
    let state = wallReducer(initialWallState, { type: "snapshot", snapshot: { photos, stats } });
    const waiting = photos.find((p) => !state.slots.includes(p.id))?.id;
    const slot = state.slots.indexOf("p5");

    state = wallReducer(state, {
      type: "event",
      event: { type: "photo.removed", photoId: "p5", stats },
    });

    expect(state.slots[slot]).toBe(waiting);
    expect(state.pool.some((p) => p.id === "p5")).toBe(false);
  });

  it("brings a waiting photo on screen for the remote, sparing the protected ones", () => {
    const photos = Array.from({ length: SLOT_COUNT + 3 }, (_, i) => photo(SLOT_COUNT + 3 - i));
    let state = wallReducer(initialWallState, { type: "snapshot", snapshot: { photos, stats } });
    const waiting = photos.find((p) => !state.slots.includes(p.id))?.id ?? "";
    // The oldest photo on screen would be replaced, unless it's protected (e.g. selected).
    const oldestSlot = slotToShow(state, waiting, []);
    const oldest = state.slots[oldestSlot] ?? "";
    const slot = slotToShow(state, waiting, [oldest]);
    expect(slot).not.toBe(oldestSlot);

    state = wallReducer(state, { type: "show", photoId: waiting, slot });
    expect(state.slots[slot]).toBe(waiting);
    expect(slotToShow(state, waiting, [])).toBe(slot);
  });
});
