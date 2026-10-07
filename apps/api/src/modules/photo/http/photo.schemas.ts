import { captionSchema, tribeSchema } from "@vegaos-demo/shared";
import { z } from "zod";

export const listPhotosQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

/** Multipart fields of POST /photos (the image itself is validated in the service). */
export const uploadFieldsSchema = z.object({
  caption: captionSchema.default(""),
  tribe: tribeSchema,
  consent: z.literal("true", { error: "Consent is required to publish a photo." }),
});

export const photoIdParamSchema = z.object({ id: z.uuid() });

/** `sig` signs links to pending images for the admin page. */
export const imageQuerySchema = z.object({
  sig: z
    .string()
    .regex(/^[0-9a-f]{32}$/)
    .optional(),
});
