import type { PhotoDTO, WallSnapshotDTO } from "@boothwall/shared";
import { describe, expect, it } from "vitest";

import { applyWallEvent } from "./applyWallEvent";

const photo = (id: string, caption: string | null = null): PhotoDTO => ({
  id,
  status: "approved",
  caption,
  tribe: "vega-os",
  imageUrl: `https://img/${id}`,
  thumbUrl: `https://img/${id}?thumb`,
  createdAt: "2026-10-10T10:00:00.000Z",
});
const stats = (total: number) => ({ total, byTribe: { "vega-os": total } });
const snapshot: WallSnapshotDTO = { photos: [photo("b"), photo("a")], stats: stats(2) };

describe("applyWallEvent", () => {
  it("puts a new photo first, once, and takes the new counts", () => {
    const next = applyWallEvent(snapshot, {
      type: "photo.created",
      photo: photo("c"),
      stats: stats(3),
    });
    expect(next.photos.map((p) => p.id)).toEqual(["c", "b", "a"]);
    expect(next.stats.total).toBe(3);

    const again = applyWallEvent(next, {
      type: "photo.created",
      photo: photo("c"),
      stats: stats(3),
    });
    expect(again.photos.map((p) => p.id)).toEqual(["c", "b", "a"]);
  });

  it("edits a photo in place and drops a removed one", () => {
    const edited = applyWallEvent(snapshot, {
      type: "photo.updated",
      photo: photo("a", "New caption"),
      stats: stats(2),
    });
    expect(edited.photos[1]?.caption).toBe("New caption");

    const removed = applyWallEvent(edited, {
      type: "photo.removed",
      photoId: "b",
      stats: stats(1),
    });
    expect(removed.photos.map((p) => p.id)).toEqual(["a"]);
    expect(removed.stats.total).toBe(1);
  });

  it("ignores remote presses", () => {
    expect(applyWallEvent(snapshot, { type: "remote.command", command: "left" })).toBe(snapshot);
  });
});
