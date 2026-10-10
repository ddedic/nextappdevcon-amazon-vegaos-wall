import type { Context } from "hono";

import type { AppEnv } from "@/core/http/http-context";

/** The caller's IP as Cloudflare reports it. Only ever hashed, for rate limits and lockout. */
export const clientIp = (c: Context<AppEnv>): string =>
  c.req.header("cf-connecting-ip") ?? "unknown";
