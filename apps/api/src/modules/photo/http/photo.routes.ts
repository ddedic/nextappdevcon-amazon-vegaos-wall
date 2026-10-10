import {
  PHOTO_LIMITS,
  photoListQuerySchema,
  photoPatchSchema,
  photoStatsQuerySchema,
} from "@boothwall/shared";
import { zValidator } from "@hono/zod-validator";
import { type Context, Hono } from "hono";
import { bodyLimit } from "hono/body-limit";

import { clientIp } from "@/core/http/client-ip";
import { badRequest } from "@/core/http/errors";
import type { AppEnv } from "@/core/http/http-context";
import { created, noContent, ok } from "@/core/http/response";
import { createDb } from "@/db/client";
import { adminOnly, isAdmin, requireAdmin } from "@/modules/auth";
import { photoHotlinkForbidden, photoTooLarge } from "@/modules/photo/domain/photo.errors";
import { photoService } from "@/modules/photo/domain/photo.service";
import type { ImageVariant, PhotoDeps } from "@/modules/photo/domain/photo.types";
import { isHotlinked } from "@/modules/photo/http/hotlink";
import { wallService } from "@/modules/wall";

import {
  imageQuerySchema,
  listPhotosQuerySchema,
  photoIdParamSchema,
  uploadFieldsSchema,
} from "./photo.schemas";

/** Caption, category and the hidden flag as JSON. */
const MAX_PATCH_BODY = 1024;

/** Midnight UTC, when the Control panel doesn't say where the booth's day starts. */
const startOfUtcDay = (now: Date) =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

/** The image, its thumbnail, multipart framing and the caption; checked before parsing. */
const MAX_UPLOAD_BODY = PHOTO_LIMITS.maxBytes + PHOTO_LIMITS.thumbMaxBytes + 16 * 1024;

const rethrow = (result: { success: boolean; error?: unknown }) => {
  if (!result.success) throw result.error;
};

const depsFrom = (c: {
  env: AppEnv["Bindings"];
  req: { url: string };
  get: (key: "config") => AppEnv["Variables"]["config"];
}): PhotoDeps => ({
  db: createDb(c.env.DB),
  bucket: c.env.PHOTOS,
  wall: wallService.broadcaster(c.env.WALL),
  origin: new URL(c.req.url).origin,
  signingKey: c.get("config").ADMIN_TOKEN,
});

/** The full image and the thumbnail share signing, hotlink and caching rules. */
const serveImage = async (
  c: Context<AppEnv>,
  id: string,
  signature: string | undefined,
  variant: ImageVariant,
) => {
  const hotlinked = isHotlinked(
    { referer: c.req.header("referer"), secFetchSite: c.req.header("sec-fetch-site") },
    c.get("config").ALLOWED_ORIGINS,
    new URL(c.req.url).origin,
  );
  if (hotlinked) throw photoHotlinkForbidden();

  const { object, contentType, approved } = await photoService.getImage(
    depsFrom(c),
    id,
    signature,
    variant,
  );
  return c.body(object.body, 200, {
    "content-type": contentType,
    // Vega's image loader enforces CORP, so it must allow the TV app. Hotlinking is
    // stopped by the Referer / Sec-Fetch-Site check above; nothing in it can ever run.
    "cross-origin-resource-policy": "cross-origin",
    "content-security-policy": "default-src 'none'; sandbox",
    "x-content-type-options": "nosniff",
    // Approved images never change; removal deletes the object. Pending ones stay private.
    "cache-control": approved ? "public, max-age=86400, immutable" : "private, no-store",
    etag: object.httpEtag,
  });
};

export const photoRouter = new Hono<AppEnv>()
  .get("/", zValidator("query", listPhotosQuerySchema, rethrow), async (c) =>
    ok(c, await photoService.getWall(depsFrom(c), c.req.valid("query").limit)),
  )
  .post(
    "/",
    bodyLimit({
      maxSize: MAX_UPLOAD_BODY,
      onError: () => {
        throw photoTooLarge({ bytes: -1, maxBytes: PHOTO_LIMITS.maxBytes });
      },
    }),
    async (c) => {
      if (!c.req.header("content-type")?.startsWith("multipart/form-data")) {
        throw badRequest("PHOTO_MULTIPART_REQUIRED");
      }
      const form = await c.req.formData();
      const image = form.get("image");
      if (!(image instanceof File)) throw badRequest("PHOTO_IMAGE_REQUIRED");
      const thumb = form.get("thumb");
      if (thumb !== null && !(thumb instanceof File)) throw badRequest("PHOTO_THUMB_INVALID");
      const fields = uploadFieldsSchema.parse(Object.fromEntries(form));
      const result = await photoService.upload(depsFrom(c), {
        image,
        thumb: thumb ?? undefined,
        caption: fields.caption,
        tribe: fields.tribe,
        clientIp: clientIp(c),
      });
      return created(c, result);
    },
  )
  .get("/pending", zValidator("query", listPhotosQuerySchema, rethrow), async (c) => {
    await requireAdmin(c);
    return ok(c, {
      photos: await photoService.getPending(depsFrom(c), c.req.valid("query").limit),
    });
  })
  // Control panel: every photo, filtered and paged. Admin is checked before the query.
  .get("/manage", adminOnly, zValidator("query", photoListQuerySchema, rethrow), async (c) =>
    ok(c, await photoService.list(depsFrom(c), c.req.valid("query"))),
  )
  .get("/stats", adminOnly, zValidator("query", photoStatsQuerySchema, rethrow), async (c) => {
    const { since } = c.req.valid("query");
    return ok(
      c,
      await photoService.stats(depsFrom(c), since ? new Date(since) : startOfUtcDay(new Date())),
    );
  })
  .patch(
    "/:id",
    adminOnly,
    bodyLimit({
      maxSize: MAX_PATCH_BODY,
      onError: () => {
        throw badRequest("PHOTO_PATCH_TOO_LARGE");
      },
    }),
    zValidator("param", photoIdParamSchema, rethrow),
    zValidator("json", photoPatchSchema, rethrow),
    async (c) =>
      ok(c, {
        photo: await photoService.update(depsFrom(c), c.req.valid("param").id, c.req.valid("json")),
      }),
  )
  .post("/:id/approve", zValidator("param", photoIdParamSchema, rethrow), async (c) => {
    await requireAdmin(c);
    return ok(c, { photo: await photoService.approve(depsFrom(c), c.req.valid("param").id) });
  })
  .delete("/:id", zValidator("param", photoIdParamSchema, rethrow), async (c) => {
    await photoService.remove(depsFrom(c), {
      id: c.req.valid("param").id,
      deleteToken: c.req.header("x-delete-token"),
      isAdmin: await isAdmin(c),
    });
    return noContent(c);
  })
  .get(
    "/:id/image",
    zValidator("param", photoIdParamSchema, rethrow),
    zValidator("query", imageQuerySchema, rethrow),
    async (c) => serveImage(c, c.req.valid("param").id, c.req.valid("query").sig, "image"),
  )
  .get(
    "/:id/thumb",
    zValidator("param", photoIdParamSchema, rethrow),
    zValidator("query", imageQuerySchema, rethrow),
    async (c) => serveImage(c, c.req.valid("param").id, c.req.valid("query").sig, "thumb"),
  );
