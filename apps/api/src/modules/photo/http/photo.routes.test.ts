import { type PhotoDTO, type Tribe, tribeSchema } from "@boothwall/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { app } from "@/app/app";
import type { AppBindings } from "@/core/runtime/bindings";
import { authFailureRepo } from "@/modules/auth/data/auth-failure.repo";
import { photoService } from "@/modules/photo/domain/photo.service";

const PASSCODE = "test-passcode";
const ID = "6f1c6c1e-9f7a-4c34-9a55-0d9ef4a1d001";
const TRIBE = tribeSchema.options[0] as Tribe;

const env = {
  DB: {},
  PHOTOS: {},
  WALL: {},
  ADMIN_TOKEN: PASSCODE,
  ALLOWED_ORIGINS: "https://booth.test",
  RETENTION_DAYS: "30",
} as unknown as AppBindings;

const photo: PhotoDTO = {
  id: ID,
  status: "hidden",
  caption: null,
  tribe: TRIBE,
  imageUrl: `https://api.test/photos/${ID}/image?sig=${"a".repeat(32)}`,
  thumbUrl: `https://api.test/photos/${ID}/thumb?sig=${"a".repeat(32)}`,
  createdAt: "2026-10-07T12:00:00.000Z",
};

const request = (path: string, init: RequestInit & { passcode?: string } = {}) => {
  const { passcode = PASSCODE, headers, ...rest } = init;
  return app.request(
    path,
    {
      ...rest,
      headers: { ...(passcode && { authorization: `Bearer ${passcode}` }), ...headers },
    },
    env,
  );
};

const patch = (body: unknown, passcode?: string) =>
  request(`/photos/${ID}`, {
    method: "PATCH",
    passcode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const errorCode = async (res: Response) =>
  ((await res.json()) as { error: { code: string } }).error.code;

const failures = () => vi.mocked(authFailureRepo.countSince);

beforeEach(() => {
  vi.spyOn(authFailureRepo, "countSince").mockResolvedValue(0);
  vi.spyOn(authFailureRepo, "add").mockResolvedValue();
});

afterEach(() => vi.restoreAllMocks());

describe("Control panel routes need the passcode", () => {
  const routes = [
    () => request("/photos/manage", { passcode: "" }),
    () => request("/photos/manage?limit=999", { passcode: "wrong-passcode" }),
    () => request("/photos/stats", { passcode: "wrong-passcode" }),
    () => patch({ hidden: true }, "wrong-passcode"),
    () => patch({ nonsense: 1 }, ""),
  ];

  it("refuses a missing or wrong passcode before reading any input", async () => {
    const list = vi.spyOn(photoService, "list");
    for (const send of routes) {
      const res = await send();
      expect(res.status).toBe(403);
      expect(await errorCode(res)).toBe("ADMIN_REQUIRED");
    }
    expect(list).not.toHaveBeenCalled();
  });

  it("locks a client out after too many wrong passcodes", async () => {
    failures().mockResolvedValue(10);
    for (const send of routes.slice(1, 4)) {
      const res = await send();
      expect(res.status).toBe(429);
      expect(await errorCode(res)).toBe("ADMIN_LOCKED");
    }
  });
});

describe("GET /photos/manage", () => {
  it("passes the parsed filters to the service", async () => {
    const list = vi
      .spyOn(photoService, "list")
      .mockResolvedValue({ photos: [photo], nextCursor: "abc" });

    const res = await request(
      `/photos/manage?status=hidden&tribe=${TRIBE}&q=%20berlin%20&sort=category&limit=50&cursor=abc`,
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ photos: [photo], nextCursor: "abc" });
    expect(list).toHaveBeenCalledWith(expect.anything(), {
      status: "hidden",
      tribe: TRIBE,
      q: "berlin",
      sort: "category",
      limit: 50,
      cursor: "abc",
    });
  });

  it("rejects pages over 50, unknown filters and bad cursors", async () => {
    for (const query of ["limit=51", "status=deleted", "sort=random", "tribe=nope"]) {
      const res = await request(`/photos/manage?${query}`);
      expect(res.status).toBe(400);
      expect(await errorCode(res)).toBe("VALIDATION_FAILED");
    }
    const res = await request("/photos/manage?cursor=bm90LWpzb24");
    expect(res.status).toBe(400);
    expect(await errorCode(res)).toBe("PHOTO_CURSOR_INVALID");
  });
});

describe("GET /photos/stats", () => {
  const stats = { onWall: 1, pending: 2, hidden: 3, uploadsToday: 6, byTribe: {} };

  it("counts today from the booth's midnight, or from midnight UTC", async () => {
    const spy = vi.spyOn(photoService, "stats").mockResolvedValue(stats);

    const res = await request("/photos/stats?since=2026-10-06T22:00:00.000Z");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(stats);
    expect(spy).toHaveBeenLastCalledWith(expect.anything(), new Date("2026-10-06T22:00:00.000Z"));

    await request("/photos/stats");
    const since = spy.mock.lastCall?.[1];
    expect(since?.getUTCHours()).toBe(0);
    expect(since?.getUTCMinutes()).toBe(0);
  });

  it("rejects a malformed start of day", async () => {
    const res = await request("/photos/stats?since=yesterday");
    expect(res.status).toBe(400);
  });
});

describe("PATCH /photos/:id", () => {
  it("edits the caption, category and visibility", async () => {
    const update = vi.spyOn(photoService, "update").mockResolvedValue(photo);

    const res = await patch({ caption: "  Hello  ", tribe: TRIBE, hidden: true });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ photo });
    expect(update).toHaveBeenCalledWith(expect.anything(), ID, {
      caption: "Hello",
      tribe: TRIBE,
      hidden: true,
    });
  });

  it("rejects empty, unknown and oversized edits and bad ids", async () => {
    const update = vi.spyOn(photoService, "update");
    for (const body of [
      {},
      { status: "approved" },
      { tribe: "nope" },
      { caption: "x".repeat(61) },
      { hidden: "yes" },
    ]) {
      const res = await patch(body);
      expect(res.status).toBe(400);
    }
    const tooBig = await patch({ caption: "x".repeat(2000) });
    expect(tooBig.status).toBe(400);
    const badId = await request("/photos/not-a-uuid", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ hidden: true }),
    });
    expect(badId.status).toBe(400);
    expect(update).not.toHaveBeenCalled();
  });
});
