import { type PhotoDTO, tribeSchema } from "@boothwall/shared";

import {
  browseTarget,
  type DirectorEvent,
  type DirectorState,
  initialDirectorState,
  pinnedIds,
  wallDirector,
} from "./wallDirector";
import { initialWallState, SLOT_COUNT, wallReducer, type WallState } from "./wallState";

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

/**
 * Drives both reducers the way useWallDirector does. `commit()` stands for React rendering:
 * until then the hook's wall ref still holds the previous wall, while the director moves on
 * every event and pins its selection on the wall straight away.
 */
function wallOf(count: number) {
  const photos = Array.from({ length: count }, (_, i) => photo(count - i)); // newest first
  let wall: WallState = wallReducer(initialWallState, {
    type: "snapshot",
    snapshot: { photos, stats },
  });
  let director: DirectorState = initialDirectorState;
  let committed = wall;

  const send = (event: DirectorEvent) => {
    director = wallDirector(director, event);
    wall = wallReducer(wall, { type: "pin", ids: pinnedIds(director) });
  };
  const commit = () => {
    committed = wall;
    const slot = director.selectedId === null ? -1 : wall.slots.indexOf(director.selectedId);
    if (slot === -1) send({ type: "selectionEmptied", slots: wall.slots, slot: 0 });
    committed = wall;
  };
  commit();

  return {
    selected: () => director.selectedId,
    pool: () => wall.pool,
    onScreen: () => director.selectedId !== null && wall.slots.includes(director.selectedId),
    commit,
    press(direction: 1 | -1) {
      const target = browseTarget(committed.pool, director.selectedId, direction);
      if (target === null) return;
      wall = wallReducer(wall, { type: "show", photoId: target });
      send({ type: "select", photoId: target });
    },
    rotate() {
      wall = wallReducer(wall, { type: "rotate" });
    },
    advance() {
      send({ type: "advance", slots: committed.slots });
    },
    arrive(n: number) {
      wall = wallReducer(wall, {
        type: "event",
        event: { type: "photo.created", photo: photo(n), stats },
      });
      commit();
      send({ type: "arrival", photoId: `p${n}` });
    },
  };
}

const ids = (from: number, to: number) =>
  Array.from({ length: from - to + 1 }, (_, i) => `p${from - i}`);

describe("browsing with the remote", () => {
  afterEach(() => jest.restoreAllMocks());

  it("walks every photo when a rotation lands between a press and its render", () => {
    // Before the fix the rotation swapped out the new selection and the walk ended in p6, p5,
    // p6, p5, ...
    jest.spyOn(Math, "random").mockReturnValue(0.3);
    const wall = wallOf(SLOT_COUNT + 5);
    const seen: (string | null)[] = [];
    for (let i = 0; i < 20; i++) {
      wall.press(1);
      if (i % 2) wall.rotate();
      wall.commit();
      seen.push(wall.selected());
      expect(wall.onScreen()).toBe(true);
    }
    expect(seen).toEqual([...ids(15, 1), ...ids(16, 12)]);
  });

  it("counts every press, even several before React renders", () => {
    const wall = wallOf(SLOT_COUNT + 2);
    wall.press(1);
    wall.press(1);
    wall.press(1);
    wall.commit();
    expect(wall.selected()).toBe("p10");

    wall.press(-1);
    wall.press(-1);
    wall.commit();
    expect(wall.selected()).toBe("p12");
  });

  it("keeps the selection when a live photo arrives in the oldest slot", () => {
    const wall = wallOf(SLOT_COUNT + 2);
    for (let i = 0; i < SLOT_COUNT; i++) {
      wall.press(1);
      wall.commit();
    }
    // The selection is now the oldest photo on screen, where arrivals used to land.
    expect(wall.selected()).toBe("p2");

    wall.arrive(100);
    expect(wall.selected()).toBe("p2");
    expect(wall.onScreen()).toBe(true);
    wall.press(1);
    wall.commit();
    expect(wall.selected()).toBe("p1");
  });

  it("walks both ways through rotations, arrivals and advances interleaved with presses", () => {
    let seed = 7;
    jest.spyOn(Math, "random").mockImplementation(() => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    });
    const wall = wallOf(SLOT_COUNT + 9);
    let arrivals = 100;
    for (let round = 0; round < 200; round++) {
      const direction = round % 40 < 20 ? 1 : -1;
      const pool = wall.pool();
      const expected = browseTarget(
        pool,
        browseTarget(pool, wall.selected(), direction),
        direction,
      );

      wall.press(direction);
      wall.press(direction);
      if (round % 3 === 0) wall.rotate();
      if (round % 7 === 0) wall.arrive((arrivals += 1));
      wall.commit();
      wall.rotate();
      expect(wall.onScreen()).toBe(true);
      expect(wall.selected()).toBe(expected);
      if (round % 11 === 0) {
        wall.advance();
        wall.commit();
        expect(wall.onScreen()).toBe(true);
      }
    }
  });
});

describe("browseTarget", () => {
  const pool = [{ id: "a" }, { id: "b" }, { id: "c" }];

  it("steps through the pool and wraps around both ends", () => {
    expect(browseTarget(pool, "a", 1)).toBe("b");
    expect(browseTarget(pool, "c", 1)).toBe("a");
    expect(browseTarget(pool, "a", -1)).toBe("c");
  });

  it("starts from the matching end when the selection is not in the pool", () => {
    expect(browseTarget(pool, null, 1)).toBe("a");
    expect(browseTarget(pool, "gone", -1)).toBe("c");
    expect(browseTarget([], "a", 1)).toBeNull();
  });
});
