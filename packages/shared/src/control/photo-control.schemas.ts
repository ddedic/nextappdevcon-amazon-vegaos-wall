import { z } from "zod";

import { captionSchema, PHOTO_LIMITS, photoSchema, photoStatusSchema } from "../wall/photo.schemas";
import { tribeSchema } from "../wall/tribes";

/** Largest page the Control panel can ask for. */
export const PHOTO_PAGE_MAX = 50;

/** "category" follows the config's category order, newest first within each. */
export const photoSortSchema = z.enum(["newest", "oldest", "category"]);

export type PhotoSort = z.infer<typeof photoSortSchema>;

/** Query of the Control panel's photo list; every filter is optional. */
export const photoListQuerySchema = z.object({
  status: photoStatusSchema.optional(),
  tribe: tribeSchema.optional(),
  /** Caption search, case-insensitive. */
  q: z
    .string()
    .trim()
    .max(PHOTO_LIMITS.captionMaxLength)
    .optional()
    .transform((value) => value || undefined),
  sort: photoSortSchema.default("newest"),
  /** Opaque, from the previous page's `nextCursor`. */
  cursor: z.string().min(1).max(200).optional(),
  limit: z.coerce.number().int().min(1).max(PHOTO_PAGE_MAX).default(24),
});

export type PhotoListQuery = z.input<typeof photoListQuerySchema>;

export const photoPageSchema = z.object({
  photos: z.array(photoSchema),
  /** null on the last page. */
  nextCursor: z.string().nullable(),
});

export type PhotoPageDTO = z.infer<typeof photoPageSchema>;

/**
 * Edit from the Control panel. `hidden` takes a photo off the wall or puts it back; `keep`
 * exempts it from retention (a demo wall's starter photos, say).
 */
export const photoPatchSchema = z
  .object({
    caption: captionSchema.optional(),
    tribe: tribeSchema.optional(),
    hidden: z.boolean().optional(),
    keep: z.boolean().optional(),
  })
  .strict()
  .refine((patch) => Object.values(patch).some((value) => value !== undefined), {
    error: "Nothing to change.",
  });

export type PhotoPatch = z.input<typeof photoPatchSchema>;

const countSchema = z.number().int().nonnegative();

/** Live numbers for the Control panel's overview. */
export const photoStatsSchema = z.object({
  onWall: countSchema,
  pending: countSchema,
  hidden: countSchema,
  /** Uploads since `since` (the booth's midnight), including ones deleted since. */
  uploadsToday: countSchema,
  byTribe: z.partialRecord(
    tribeSchema,
    z.object({ onWall: countSchema, pending: countSchema, hidden: countSchema }),
  ),
});

export type PhotoStatsDTO = z.infer<typeof photoStatsSchema>;

export const photoStatsQuerySchema = z.object({
  /** Start of "today" where the booth is; defaults to midnight UTC. */
  since: z.iso.datetime({ offset: true }).optional(),
});
