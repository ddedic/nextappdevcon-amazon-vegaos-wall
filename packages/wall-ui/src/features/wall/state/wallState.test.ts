import { type PhotoDTO, tribeSchema } from "@boothwall/shared";

import { POOL_LIMIT } from "../constants/feed";
import { initialWallState, SLOT_COUNT, slotToShow, wallReducer } from "./wallState";

const photo = (n: number): PhotoDTO => ({
  id: `p${n}`,
  status: "approved",
  caption: null,
  tribe: tribeSchema.options[0],
  imageUrl: `https://api.test/photos/p${n}/image`,
  thumbUrl: `https://api.test/photos/p${n}/thumb`,
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

  it("applies an edit in place, without moving the photo or marking it new", () => {
    const photos = Array.from({ length: SLOT_COUNT }, (_, i) => photo(SLOT_COUNT - i));
    let state = wallReducer(initialWallState, { type: "snapshot", snapshot: { photos, stats } });
    const slots = state.slots;
    const tribe = tribeSchema.options.at(-1) ?? tribeSchema.options[0];
    const edited = { ...photo(3), caption: "Fixed typo", tribe };
    const nextStats = { total: SLOT_COUNT, byTribe: { [tribe]: 1 } };

    state = wallReducer(state, {
      type: "event",
      event: { type: "photo.updated", photo: edited, stats: nextStats },
    });

    expect(state.slots).toEqual(slots);
    expect(state.pool.find((p) => p.id === "p3")).toEqual(edited);
    expect(state.pool.map((p) => p.id)).toEqual(photos.map((p) => p.id));
    expect(state.fresh).toEqual([]);
    expect(state.stats).toBe(nextStats);
  });

  it("ignores an edit to a photo it doesn't hold, apart from the stats", () => {
    let state = wallReducer(initialWallState, {
      type: "snapshot",
      snapshot: { photos: [photo(1)], stats },
    });
    const nextStats = { total: 1, byTribe: {} };
    state = wallReducer(state, {
      type: "event",
      event: { type: "photo.updated", photo: photo(42), stats: nextStats },
    });
    expect(state.pool.map((p) => p.id)).toEqual(["p1"]);
    expect(state.stats).toBe(nextStats);
  });

  it("brings a waiting photo on screen for the remote, sparing the pinned ones", () => {
    const photos = Array.from({ length: SLOT_COUNT + 3 }, (_, i) => photo(SLOT_COUNT + 3 - i));
    let state = wallReducer(initialWallState, { type: "snapshot", snapshot: { photos, stats } });
    const waiting = photos.find((p) => !state.slots.includes(p.id))?.id ?? "";
    // The oldest photo on screen would be replaced, unless it's pinned (e.g. selected).
    const oldestSlot = slotToShow(state, waiting);
    const oldest = state.slots[oldestSlot] ?? "";
    state = wallReducer(state, { type: "pin", ids: [oldest] });
    const slot = slotToShow(state, waiting);
    expect(slot).not.toBe(oldestSlot);

    state = wallReducer(state, { type: "show", photoId: waiting });
    expect(state.slots[slot]).toBe(waiting);
    expect(state.slots[oldestSlot]).toBe(oldest);
    expect(slotToShow(state, waiting)).toBe(slot);
  });

  it("never rotates out or lands an arrival on a pinned photo", () => {
    const photos = Array.from({ length: SLOT_COUNT + 3 }, (_, i) => photo(SLOT_COUNT + 3 - i));
    let state = wallReducer(initialWallState, { type: "snapshot", snapshot: { photos, stats } });
    const oldest = state.slots[slotToShow(state, "p1")] ?? "";
    state = wallReducer(state, { type: "pin", ids: [oldest] });

    const random = jest.spyOn(Math, "random");
    for (const value of [0, 0.5, 0.999]) {
      random.mockReturnValue(value);
      state = wallReducer(state, { type: "rotate" });
    }
    random.mockRestore();
    state = wallReducer(state, {
      type: "event",
      event: { type: "photo.created", photo: photo(99), stats },
    });

    expect(state.slots).toContain(oldest);
    expect(state.slots).toContain("p99");
  });

  it("drops photos that fell out of the pool and stale fresh ids", () => {
    const photos = Array.from({ length: POOL_LIMIT }, (_, i) => photo(POOL_LIMIT - i));
    let state = wallReducer(initialWallState, { type: "snapshot", snapshot: { photos, stats } });
    // The oldest photo in the pool is on screen when the pool overflows.
    state = wallReducer(state, { type: "show", photoId: "p1" });
    // A burst fills every slot with arrivals that never settle.
    for (let n = 1; n <= SLOT_COUNT + 3; n++) {
      state = wallReducer(state, {
        type: "event",
        event: { type: "photo.created", photo: photo(1000 + n), stats },
      });
    }

    const pool = new Set(state.pool.map((p) => p.id));
    expect(state.pool).toHaveLength(POOL_LIMIT);
    expect(state.slots.every((id) => id !== null && pool.has(id))).toBe(true);
    expect(state.fresh.length).toBeLessThanOrEqual(SLOT_COUNT);
    expect(state.fresh.every((id) => state.slots.includes(id))).toBe(true);
  });
});
