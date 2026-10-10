import { PHOTO_LIMITS, type Tribe, tribeSchema } from "@boothwall/shared";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Db } from "@/db/client";
import type { PhotoRow } from "@/db/schema";
import { photoRepo } from "@/modules/photo/data/photo.repo";
import { photoStorageRepo } from "@/modules/photo/data/photo-storage.repo";

import {
  PHOTO_CURSOR_INVALID,
  PHOTO_DELETE_FORBIDDEN,
  PHOTO_DIMENSIONS_TOO_LARGE,
  PHOTO_NOT_FOUND,
  PHOTO_RATE_LIMITED,
  PHOTO_TOO_LARGE,
  PHOTO_UNSUPPORTED_TYPE,
  PHOTO_WALL_BUSY,
} from "./photo.errors";
import { photoService } from "./photo.service";
import type { PhotoDeps } from "./photo.types";

/** Any two categories from the config; the service doesn't care which. */
const A_TRIBE = tribeSchema.options[0] as Tribe;
const B_TRIBE: Tribe = tribeSchema.options.at(-1) ?? A_TRIBE;

const now = new Date("2026-10-07T12:00:00.000Z");

const makeDeps = () => {
  const broadcast = vi.fn().mockResolvedValue(undefined);
  const deps: PhotoDeps = {
    db: {} as Db,
    bucket: {} as R2Bucket,
    wall: { broadcast },
    origin: "https://api.test",
    signingKey: "test-signing-key",
    now: () => now,
  };
  return { deps, broadcast };
};

/** Just enough JPEG for the header checks: SOI, then a frame header with the size. */
const jpeg = (width = 1080, height = 810) =>
  new File(
    [
      new Uint8Array([
        0xff,
        0xd8,
        0xff,
        0xe0,
        0x00,
        0x04,
        0x00,
        0x00,
        0xff,
        0xc0,
        0x00,
        0x11,
        0x08,
        height >> 8,
        height & 0xff,
        width >> 8,
        width & 0xff,
        0x03,
        ...Array(12).fill(0),
      ]),
    ],
    "me.jpg",
    { type: "image/jpeg" },
  );

const row = (overrides: Partial<PhotoRow> = {}): PhotoRow => ({
  id: "6f1c6c1e-9f7a-4c34-9a55-0d9ef4a1d001",
  caption: "Hi Berlin",
  tribe: A_TRIBE,
  status: "approved",
  objectKey: "photos/x",
  contentType: "image/jpeg",
  thumbKey: null,
  ipHash: "h",
  deleteTokenHash: "not-a-real-hash",
  createdAt: now,
  approvedAt: now,
  removedAt: null,
  keep: false,
  ...overrides,
});

/** Every limit has room unless a test says otherwise. */
const underLimits = () => {
  vi.spyOn(photoRepo, "countRecentByIpHash").mockResolvedValue(0);
  vi.spyOn(photoRepo, "countPending").mockResolvedValue(0);
  vi.spyOn(photoRepo, "countCreatedSince").mockResolvedValue(0);
};

afterEach(() => vi.restoreAllMocks());

describe("photoService.upload", () => {
  it("stores the image and saves a pending row without touching the wall", async () => {
    const { deps, broadcast } = makeDeps();
    underLimits();
    const put = vi.spyOn(photoStorageRepo, "put").mockResolvedValue();
    vi.spyOn(photoRepo, "create").mockImplementation(async (_db, values) =>
      row(values as PhotoRow),
    );
    vi.spyOn(photoRepo, "countApprovedByTribe").mockResolvedValue([{ tribe: A_TRIBE, value: 1 }]);

    const result = await photoService.upload(deps, {
      image: jpeg(),
      caption: "Hi Berlin",
      tribe: A_TRIBE,
      clientIp: "1.2.3.4",
    });

    expect(put).toHaveBeenCalledOnce();
    expect(result.deleteToken).toMatch(/^[0-9a-f]{48}$/);
    expect(result.photo.imageUrl).toBe(`https://api.test/photos/${result.photo.id}/image`);
    expect(result.photo.thumbUrl).toBe(result.photo.imageUrl);
    expect(result.photo.status).toBe("pending");
    expect(broadcast).not.toHaveBeenCalled();
  });

  it("stores the thumbnail next to the image and links it", async () => {
    const { deps } = makeDeps();
    underLimits();
    const put = vi.spyOn(photoStorageRepo, "put").mockResolvedValue();
    vi.spyOn(photoRepo, "create").mockImplementation(async (_db, values) =>
      row(values as PhotoRow),
    );

    const result = await photoService.upload(deps, {
      image: jpeg(),
      thumb: jpeg(480, 360),
      caption: null,
      tribe: A_TRIBE,
      clientIp: "1.2.3.4",
    });

    const { id } = result.photo;
    expect(put).toHaveBeenCalledWith(deps.bucket, `thumbs/${id}`, expect.anything(), "image/jpeg");
    expect(result.photo.thumbUrl).toBe(`https://api.test/photos/${id}/thumb`);
  });

  it("checks the thumbnail like the image", async () => {
    const { deps } = makeDeps();
    underLimits();
    const put = vi.spyOn(photoStorageRepo, "put");
    const upload = (thumb: File) =>
      photoService.upload(deps, {
        image: jpeg(),
        thumb,
        caption: null,
        tribe: A_TRIBE,
        clientIp: "1.2.3.4",
      });

    await expect(
      upload(new File(["<svg/>"], "t.jpg", { type: "image/jpeg" })),
    ).rejects.toMatchObject({ code: PHOTO_UNSUPPORTED_TYPE });
    await expect(upload(jpeg(4000, 3000))).rejects.toMatchObject({
      code: PHOTO_DIMENSIONS_TOO_LARGE,
    });
    await expect(
      upload(
        new File([new Uint8Array(PHOTO_LIMITS.thumbMaxBytes + 1)], "t.jpg", { type: "image/jpeg" }),
      ),
    ).rejects.toMatchObject({ code: PHOTO_TOO_LARGE });
    expect(put).not.toHaveBeenCalled();
  });

  it("rejects uploads over the per-client burst limit without storing anything", async () => {
    const { deps } = makeDeps();
    vi.spyOn(photoRepo, "countRecentByIpHash").mockResolvedValue(60);
    const put = vi.spyOn(photoStorageRepo, "put");

    await expect(
      photoService.upload(deps, {
        image: jpeg(),
        caption: null,
        tribe: B_TRIBE,
        clientIp: "1.2.3.4",
      }),
    ).rejects.toMatchObject({ code: PHOTO_RATE_LIMITED, status: 429 });
    expect(put).not.toHaveBeenCalled();
  });

  it("refuses everyone once the global caps are hit, so cost stays bounded", async () => {
    const { deps } = makeDeps();
    underLimits();
    vi.spyOn(photoRepo, "countPending").mockResolvedValue(300);
    const put = vi.spyOn(photoStorageRepo, "put");

    await expect(
      photoService.upload(deps, {
        image: jpeg(),
        caption: null,
        tribe: B_TRIBE,
        clientIp: "9.9.9.9",
      }),
    ).rejects.toMatchObject({ code: PHOTO_WALL_BUSY, status: 503 });
    expect(put).not.toHaveBeenCalled();
  });

  it("checks the real bytes, not the declared type", async () => {
    const { deps } = makeDeps();
    underLimits();
    const put = vi.spyOn(photoStorageRepo, "put");
    const disguised = new File(["<html><script>alert(1)</script>"], "x.jpg", {
      type: "image/jpeg",
    });

    await expect(
      photoService.upload(deps, {
        image: disguised,
        caption: null,
        tribe: B_TRIBE,
        clientIp: "1.1.1.1",
      }),
    ).rejects.toMatchObject({ code: PHOTO_UNSUPPORTED_TYPE, status: 415 });
    expect(put).not.toHaveBeenCalled();

    // A tiny file that claims a 20000px frame would exhaust the TV's memory.
    await expect(
      photoService.upload(deps, {
        image: jpeg(20000, 20000),
        caption: null,
        tribe: B_TRIBE,
        clientIp: "1.1.1.1",
      }),
    ).rejects.toMatchObject({ code: PHOTO_DIMENSIONS_TOO_LARGE, status: 413 });
    expect(put).not.toHaveBeenCalled();
  });
});

describe("photoService.getImage", () => {
  it("serves a pending image only through the Control panel's signed link", async () => {
    const { deps } = makeDeps();
    const pending = row({ status: "pending", approvedAt: null });
    vi.spyOn(photoRepo, "findById").mockResolvedValue(pending);
    vi.spyOn(photoRepo, "findByStatus").mockResolvedValue([pending]);
    vi.spyOn(photoStorageRepo, "get").mockResolvedValue({} as R2ObjectBody);

    await expect(photoService.getImage(deps, pending.id, undefined)).rejects.toMatchObject({
      code: PHOTO_NOT_FOUND,
    });
    await expect(photoService.getImage(deps, pending.id, "0".repeat(32))).rejects.toMatchObject({
      code: PHOTO_NOT_FOUND,
    });

    const [listed] = await photoService.getPending(deps, 10);
    const sig = new URL(listed?.imageUrl ?? "").searchParams.get("sig") ?? undefined;
    await expect(photoService.getImage(deps, pending.id, sig)).resolves.toMatchObject({
      approved: false,
    });
  });

  it("serves the thumbnail, or the full image when the photo has none", async () => {
    const { deps } = makeDeps();
    const thumb = { httpMetadata: { contentType: "image/jpeg" } } as R2ObjectBody;
    const full = {} as R2ObjectBody;
    const get = vi
      .spyOn(photoStorageRepo, "get")
      .mockImplementation(async (_bucket, key) => (key.startsWith("thumbs/") ? thumb : full));
    const find = vi.spyOn(photoRepo, "findById");

    find.mockResolvedValue(row({ thumbKey: "thumbs/x" }));
    await expect(photoService.getImage(deps, row().id, undefined, "thumb")).resolves.toMatchObject({
      object: thumb,
    });

    find.mockResolvedValue(row());
    await expect(photoService.getImage(deps, row().id, undefined, "thumb")).resolves.toMatchObject({
      object: full,
    });
    expect(get).toHaveBeenLastCalledWith(deps.bucket, "photos/x");
  });
});

describe("photoService.approve", () => {
  it("approves a pending photo and broadcasts it to the wall", async () => {
    const { deps, broadcast } = makeDeps();
    vi.spyOn(photoRepo, "findById").mockResolvedValue(row({ status: "pending", approvedAt: null }));
    vi.spyOn(photoRepo, "approve").mockResolvedValue(row());
    vi.spyOn(photoRepo, "countApprovedByTribe").mockResolvedValue([{ tribe: A_TRIBE, value: 1 }]);

    const photo = await photoService.approve(deps, row().id);

    expect(photo.status).toBe("approved");
    expect(broadcast).toHaveBeenCalledWith({
      type: "photo.created",
      photo,
      stats: { total: 1, byTribe: { [A_TRIBE]: 1 } },
    });
  });
});

describe("photoService.remove", () => {
  it("requires the owner's delete token unless the caller is admin", async () => {
    const { deps, broadcast } = makeDeps();
    vi.spyOn(photoRepo, "findById").mockResolvedValue(row());
    vi.spyOn(photoRepo, "setRemoved").mockResolvedValue();
    vi.spyOn(photoRepo, "countApprovedByTribe").mockResolvedValue([]);
    const del = vi.spyOn(photoStorageRepo, "delete").mockResolvedValue();
    const id = row().id;

    await expect(
      photoService.remove(deps, { id, deleteToken: "wrong", isAdmin: false }),
    ).rejects.toMatchObject({ code: PHOTO_DELETE_FORBIDDEN, status: 403 });
    expect(del).not.toHaveBeenCalled();

    await photoService.remove(deps, { id, isAdmin: true });
    expect(del).toHaveBeenCalledWith(deps.bucket, "photos/x");
    expect(del).toHaveBeenCalledTimes(1);
    expect(broadcast).toHaveBeenCalledWith({
      type: "photo.removed",
      photoId: id,
      stats: { total: 0, byTribe: {} },
    });
  });
});

describe("photoService.purgeExpired", () => {
  it("deletes the thumbnail along with the image and the row", async () => {
    const { deps } = makeDeps();
    vi.spyOn(photoRepo, "findCreatedBefore").mockResolvedValue([row({ thumbKey: "thumbs/x" })]);
    const deleteRow = vi.spyOn(photoRepo, "deleteById").mockResolvedValue();
    const del = vi.spyOn(photoStorageRepo, "delete").mockResolvedValue();

    await expect(photoService.purgeExpired(deps, { retentionDays: 7, now })).resolves.toBe(1);
    expect(del).toHaveBeenCalledWith(deps.bucket, "photos/x");
    expect(del).toHaveBeenCalledWith(deps.bucket, "thumbs/x");
    expect(deleteRow).toHaveBeenCalledWith(deps.db, row().id);
  });

  it("leaves photos marked keep alone", async () => {
    const { deps } = makeDeps();
    vi.spyOn(photoRepo, "findCreatedBefore").mockResolvedValue([row({ keep: true })]);
    const deleteRow = vi.spyOn(photoRepo, "deleteById").mockResolvedValue();
    const del = vi.spyOn(photoStorageRepo, "delete").mockResolvedValue();

    await expect(photoService.purgeExpired(deps, { retentionDays: 7, now })).resolves.toBe(0);
    expect(del).not.toHaveBeenCalled();
    expect(deleteRow).not.toHaveBeenCalled();
  });
});

const ID_2 = "6f1c6c1e-9f7a-4c34-9a55-0d9ef4a1d002";
const ID_3 = "6f1c6c1e-9f7a-4c34-9a55-0d9ef4a1d003";

describe("photoService.list", () => {
  it("pages by cursor and signs the images that aren't on the wall", async () => {
    const { deps } = makeDeps();
    const rows = [
      { ...row(), rank: 0 },
      { ...row({ id: ID_2, status: "hidden" }), rank: 0 },
      { ...row({ id: ID_3, status: "pending", approvedAt: null }), rank: 0 },
    ];
    const list = vi.spyOn(photoRepo, "list").mockResolvedValue(rows);

    const page = await photoService.list(deps, { sort: "newest", limit: 2 });

    expect(list).toHaveBeenCalledWith(deps.db, { sort: "newest", limit: 3, cursor: undefined });
    expect(page.photos.map((photo) => photo.id)).toEqual([row().id, ID_2]);
    expect(page.photos[0]?.imageUrl).not.toContain("sig=");
    expect(page.photos[1]?.imageUrl).toMatch(/\?sig=[0-9a-f]{32}$/);
    expect(page.nextCursor).toEqual(expect.any(String));

    list.mockResolvedValue(rows.slice(2));
    const next = await photoService.list(deps, {
      sort: "newest",
      limit: 2,
      cursor: page.nextCursor ?? "",
    });
    expect(list).toHaveBeenLastCalledWith(deps.db, {
      sort: "newest",
      limit: 3,
      cursor: { rank: 0, createdAt: now.getTime(), id: ID_2 },
    });
    expect(next.nextCursor).toBeNull();
    expect(next.photos[0]?.imageUrl).toContain("sig=");
  });

  it("refuses a cursor from another sort or a made-up one", async () => {
    const { deps } = makeDeps();
    vi.spyOn(photoRepo, "list").mockResolvedValue([
      { ...row(), rank: 0 },
      { ...row({ id: ID_2 }), rank: 0 },
    ]);
    const { nextCursor } = await photoService.list(deps, { sort: "newest", limit: 1 });

    for (const cursor of [nextCursor ?? "", "not-a-cursor", btoa("[1,2,3]")]) {
      await expect(
        photoService.list(deps, {
          sort: cursor === nextCursor ? "oldest" : "newest",
          limit: 1,
          cursor,
        }),
      ).rejects.toMatchObject({ code: PHOTO_CURSOR_INVALID, status: 400 });
    }
  });
});

describe("photoService.update", () => {
  const withStats = () =>
    vi.spyOn(photoRepo, "countApprovedByTribe").mockResolvedValue([{ tribe: A_TRIBE, value: 1 }]);

  it("hides a photo on the wall and takes it off every screen", async () => {
    const { deps, broadcast } = makeDeps();
    withStats();
    vi.spyOn(photoRepo, "findById").mockResolvedValue(row());
    const update = vi
      .spyOn(photoRepo, "update")
      .mockImplementation(async (_db, _id, values) => row(values));

    const photo = await photoService.update(deps, row().id, { hidden: true });

    expect(update).toHaveBeenCalledWith(deps.db, row().id, { status: "hidden" });
    expect(photo.status).toBe("hidden");
    expect(photo.imageUrl).toContain("sig=");
    expect(broadcast).toHaveBeenCalledWith({
      type: "photo.removed",
      photoId: row().id,
      stats: { total: 1, byTribe: { [A_TRIBE]: 1 } },
    });
  });

  it("puts a hidden photo back as a new arrival, approving it if it never was", async () => {
    const { deps, broadcast } = makeDeps();
    withStats();
    vi.spyOn(photoRepo, "findById").mockResolvedValue(row({ status: "hidden", approvedAt: null }));
    const update = vi
      .spyOn(photoRepo, "update")
      .mockImplementation(async (_db, _id, values) => row(values));

    const photo = await photoService.update(deps, row().id, { hidden: false });

    expect(update).toHaveBeenCalledWith(deps.db, row().id, { status: "approved", approvedAt: now });
    expect(photo.imageUrl).not.toContain("sig=");
    expect(broadcast).toHaveBeenCalledWith(
      expect.objectContaining({ type: "photo.created", photo }),
    );
  });

  it("sends caption and category edits on the wall as photo.updated", async () => {
    const { deps, broadcast } = makeDeps();
    withStats();
    vi.spyOn(photoRepo, "findById").mockResolvedValue(row());
    vi.spyOn(photoRepo, "update").mockImplementation(async (_db, _id, values) => row(values));

    const photo = await photoService.update(deps, row().id, { caption: null, tribe: B_TRIBE });

    expect(photo).toMatchObject({ caption: null, tribe: B_TRIBE, status: "approved" });
    expect(broadcast).toHaveBeenCalledWith(
      expect.objectContaining({ type: "photo.updated", photo }),
    );
  });

  it("keeps edits to photos off the wall, and no-op edits, off the socket", async () => {
    const { deps, broadcast } = makeDeps();
    const find = vi.spyOn(photoRepo, "findById");
    vi.spyOn(photoRepo, "update").mockImplementation(async (_db, _id, values) =>
      row({ status: "pending", approvedAt: null, ...values }),
    );

    find.mockResolvedValue(row({ status: "pending", approvedAt: null }));
    await photoService.update(deps, row().id, { caption: "Edited", hidden: false });
    find.mockResolvedValue(row({ status: "pending", approvedAt: null, caption: "Same" }));
    await photoService.update(deps, row().id, { caption: "Same" });

    expect(broadcast).not.toHaveBeenCalled();
  });

  it("can't edit a deleted photo", async () => {
    const { deps } = makeDeps();
    vi.spyOn(photoRepo, "findById").mockResolvedValue(row({ removedAt: now }));
    await expect(photoService.update(deps, row().id, { hidden: true })).rejects.toMatchObject({
      code: PHOTO_NOT_FOUND,
    });
  });
});

describe("photoService.stats", () => {
  it("counts photos per status and category, and uploads since the booth's midnight", async () => {
    const { deps } = makeDeps();
    const midnight = new Date("2026-10-07T00:00:00.000Z");
    vi.spyOn(photoRepo, "countByStatusAndTribe").mockResolvedValue([
      { status: "approved", tribe: A_TRIBE, value: 3 },
      { status: "pending", tribe: A_TRIBE, value: 1 },
      { status: "hidden", tribe: B_TRIBE, value: 2 },
      { status: "approved", tribe: "retired-category", value: 4 },
    ]);
    const since = vi.spyOn(photoRepo, "countCreatedSince").mockResolvedValue(9);

    const stats = await photoService.stats(deps, midnight);

    expect(since).toHaveBeenCalledWith(deps.db, midnight);
    expect(stats).toEqual({
      onWall: 7,
      pending: 1,
      hidden: 2,
      uploadsToday: 9,
      byTribe: {
        [A_TRIBE]: { onWall: 3, pending: 1, hidden: 0 },
        [B_TRIBE]: { onWall: 0, pending: 0, hidden: 2 },
      },
    });
  });
});

describe("photoService.getImage for hidden photos", () => {
  it("keeps a hidden image private, like a pending one", async () => {
    const { deps } = makeDeps();
    vi.spyOn(photoRepo, "findById").mockResolvedValue(row({ status: "hidden" }));
    vi.spyOn(photoStorageRepo, "get").mockResolvedValue({} as R2ObjectBody);
    await expect(photoService.getImage(deps, row().id, undefined)).rejects.toMatchObject({
      code: PHOTO_NOT_FOUND,
    });
  });
});
