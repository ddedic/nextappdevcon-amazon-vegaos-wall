import { zValidator } from "@hono/zod-validator";
import { PHOTO_LIMITS } from "@vegaos-demo/shared";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";

import { badRequest } from "@/core/http/errors";
import type { AppEnv } from "@/core/http/http-context";
import { created, noContent, ok } from "@/core/http/response";
import { createDb } from "@/db/client";
import { isAdmin, requireAdmin } from "@/modules/auth";
import { photoHotlinkForbidden, photoTooLarge } from "@/modules/photo/domain/photo.errors";
import { photoService } from "@/modules/photo/domain/photo.service";
import type { PhotoDeps } from "@/modules/photo/domain/photo.types";
import { isHotlinked } from "@/modules/photo/http/hotlink";
import { wallService } from "@/modules/wall";

import {
  imageQuerySchema,
  listPhotosQuerySchema,
  photoIdParamSchema,
  uploadFieldsSchema,
} from "./photo.schemas";

/** The image plus multipart framing and the caption; checked before anything is parsed. */
const MAX_UPLOAD_BODY = PHOTO_LIMITS.maxBytes + 16 * 1024;

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
      const fields = uploadFieldsSchema.parse(Object.fromEntries(form));
      const result = await photoService.upload(depsFrom(c), {
        image,
        caption: fields.caption,
        tribe: fields.tribe,
        clientIp: c.req.header("cf-connecting-ip") ?? "unknown",
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
    async (c) => {
      const hotlinked = isHotlinked(
        { referer: c.req.header("referer"), secFetchSite: c.req.header("sec-fetch-site") },
        c.get("config").ALLOWED_ORIGINS,
        new URL(c.req.url).origin,
      );
      if (hotlinked) throw photoHotlinkForbidden();

      const { object, contentType, approved } = await photoService.getImage(
        depsFrom(c),
        c.req.valid("param").id,
        c.req.valid("query").sig,
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
    },
  );
