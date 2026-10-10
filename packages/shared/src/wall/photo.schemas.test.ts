import { describe, expect, it } from "vitest";

import { captionSchema, PHOTO_LIMITS, photoSchema } from "./photo.schemas";
import { tribeSchema } from "./tribes";
import { wallEventSchema } from "./wall-events.schemas";

describe("wall contracts", () => {
  it("normalises captions and enforces the length limit", () => {
    expect(captionSchema.parse("  hi  ")).toBe("hi");
    expect(captionSchema.parse("   ")).toBeNull();
    expect(captionSchema.safeParse("x".repeat(PHOTO_LIMITS.captionMaxLength + 1)).success).toBe(
      false,
    );
  });

  it("requires a thumbnail URL on every photo", () => {
    const photo = {
      id: "p1",
      status: "approved",
      caption: null,
      tribe: tribeSchema.options[0],
      imageUrl: "/photos/p1/image",
      createdAt: "2026-10-07T12:00:00.000Z",
    };
    expect(photoSchema.safeParse(photo).success).toBe(false);
    expect(photoSchema.safeParse({ ...photo, thumbUrl: "/photos/p1/thumb" }).success).toBe(true);
    expect(PHOTO_LIMITS.thumbEdgePx).toBeLessThan(PHOTO_LIMITS.maxEdgePx);
  });

  it("rejects wall events with an unknown tribe", () => {
    const event = {
      type: "photo.created",
      stats: { total: 1, byTribe: {} },
      photo: {
        id: "p1",
        status: "approved",
        caption: null,
        tribe: "nope",
        imageUrl: "/photos/p1/image",
        thumbUrl: "/photos/p1/thumb",
        createdAt: "2026-10-07T12:00:00.000Z",
      },
    };
    expect(wallEventSchema.safeParse(event).success).toBe(false);
  });
});
