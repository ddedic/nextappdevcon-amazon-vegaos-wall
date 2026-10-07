import { describe, expect, it } from "vitest";

import { captionSchema, PHOTO_LIMITS } from "./photo.schemas";
import { wallEventSchema } from "./wall-events.schemas";

describe("wall contracts", () => {
  it("normalises captions and enforces the length limit", () => {
    expect(captionSchema.parse("  hi  ")).toBe("hi");
    expect(captionSchema.parse("   ")).toBeNull();
    expect(captionSchema.safeParse("x".repeat(PHOTO_LIMITS.captionMaxLength + 1)).success).toBe(
      false,
    );
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
        createdAt: "2026-10-07T12:00:00.000Z",
      },
    };
    expect(wallEventSchema.safeParse(event).success).toBe(false);
  });
});
