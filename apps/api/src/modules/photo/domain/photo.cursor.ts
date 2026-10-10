import type { PhotoSort } from "@boothwall/shared";
import { z } from "zod";

import { photoCursorInvalid } from "./photo.errors";
import type { PhotoCursor } from "./photo.types";

/** [sort, rank, createdAt ms, id]: a cursor only continues the sort it came from. */
const cursorSchema = z.tuple([
  z.string(),
  z.number().int().nonnegative(),
  z.number().int().nonnegative(),
  z.uuid(),
]);

const toBase64Url = (text: string) =>
  btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const fromBase64Url = (value: string) => atob(value.replace(/-/g, "+").replace(/_/g, "/"));

/** Keyset cursors for the Control panel list: stable while photos arrive or leave. */
export const photoCursor = {
  encode(sort: PhotoSort, { rank, createdAt, id }: PhotoCursor): string {
    return toBase64Url(JSON.stringify([sort, rank, createdAt, id]));
  },

  decode(sort: PhotoSort, value: string): PhotoCursor {
    let raw: unknown;
    try {
      raw = JSON.parse(fromBase64Url(value));
    } catch {
      throw photoCursorInvalid();
    }
    const parsed = cursorSchema.safeParse(raw);
    if (!parsed.success || parsed.data[0] !== sort) throw photoCursorInvalid();
    const [, rank, createdAt, id] = parsed.data;
    return { rank, createdAt, id };
  },
};
