import { describe, expect, it } from "vitest";

import { type Tribe, tribeSchema } from "../wall/tribes";
import { wallEventSchema } from "../wall/wall-events.schemas";
import { PHOTO_PAGE_MAX, photoListQuerySchema, photoPatchSchema } from "./photo-control.schemas";

const tribe = tribeSchema.options[0] as Tribe;

describe("control contracts", () => {
  it("defaults the list query and caps the page size", () => {
    expect(photoListQuerySchema.parse({})).toEqual({ sort: "newest", limit: 24 });
    expect(photoListQuerySchema.parse({ q: "  ", limit: "10" })).toEqual({
      sort: "newest",
      limit: 10,
    });
    expect(photoListQuerySchema.safeParse({ limit: PHOTO_PAGE_MAX + 1 }).success).toBe(false);
    expect(photoListQuerySchema.safeParse({ status: "deleted" }).success).toBe(false);
  });

  it("accepts a partial edit, clears an empty caption and refuses an empty one", () => {
    expect(photoPatchSchema.parse({ caption: "  " })).toEqual({ caption: null });
    expect(photoPatchSchema.parse({ tribe, hidden: true })).toEqual({ tribe, hidden: true });
    expect(photoPatchSchema.safeParse({}).success).toBe(false);
    expect(photoPatchSchema.safeParse({ status: "approved" }).success).toBe(false);
    expect(photoPatchSchema.safeParse({ tribe: "nope" }).success).toBe(false);
  });

  it("carries edits to the wall as photo.updated", () => {
    const event = {
      type: "photo.updated",
      stats: { total: 1, byTribe: { [tribe]: 1 } },
      photo: {
        id: "p1",
        status: "approved",
        caption: "New caption",
        tribe,
        imageUrl: "/photos/p1/image",
        thumbUrl: "/photos/p1/thumb",
        createdAt: "2026-10-07T12:00:00.000Z",
      },
    };
    expect(wallEventSchema.safeParse(event).success).toBe(true);
  });
});
