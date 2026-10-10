import { type Tribe, tribeSchema } from "@boothwall/shared";
import { afterEach, describe, expect, it, vi } from "vitest";

import { uploadPhoto } from "./uploadPhoto";

const TRIBE = tribeSchema.options[0] as Tribe;

const photo = {
  id: "p1",
  status: "pending",
  caption: null,
  tribe: TRIBE,
  imageUrl: "https://api.test/photos/p1/image",
  thumbUrl: "https://api.test/photos/p1/thumb",
  createdAt: "2026-10-07T12:00:00.000Z",
};

afterEach(() => vi.unstubAllGlobals());

describe("uploadPhoto", () => {
  it("sends the thumbnail next to the image and validates the reply", async () => {
    const fetch = vi.fn(async () => Response.json({ photo, deleteToken: "t" }, { status: 201 }));
    vi.stubGlobal("fetch", fetch);

    const result = await uploadPhoto({
      image: new Blob(["image"], { type: "image/jpeg" }),
      thumb: new Blob(["thumb"], { type: "image/jpeg" }),
      caption: "Hi",
      tribe: TRIBE,
    });

    const form = (fetch.mock.calls[0] as unknown as [string, RequestInit])[1].body as FormData;
    expect(form.get("image")).toBeInstanceOf(Blob);
    expect(await (form.get("thumb") as Blob).text()).toBe("thumb");
    expect(result.photo.thumbUrl).toBe(photo.thumbUrl);
  });
});
