import type { Context } from "hono";

export const ok = <T>(c: Context, data: T) => c.json(data, 200);

export const created = <T>(c: Context, data: T) => c.json(data, 201);

export const noContent = (c: Context) => c.body(null, 204);

export const errorBody = (code: string, messageKey: string, details?: unknown) => ({
  error: { code, messageKey, details },
});
