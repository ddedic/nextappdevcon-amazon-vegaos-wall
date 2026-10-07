import type { Context } from "hono";

import type { AppEnv } from "@/core/http/http-context";
import { createDb } from "@/db/client";
import { adminGuardService } from "@/modules/auth/domain/admin-guard.service";
import { adminRequired } from "@/modules/auth/domain/auth.errors";

const bearer = (c: Context<AppEnv>) => {
  const header = c.req.header("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
};

/** Booth operator check: `Authorization: Bearer <ADMIN_TOKEN>`, with brute-force lockout. */
export function isAdmin(c: Context<AppEnv>): Promise<boolean> {
  return adminGuardService.verify({
    db: createDb(c.env.DB),
    token: bearer(c),
    adminToken: c.get("config").ADMIN_TOKEN,
    clientIp: c.req.header("cf-connecting-ip") ?? "unknown",
    now: new Date(),
  });
}

export async function requireAdmin(c: Context<AppEnv>): Promise<void> {
  if (!(await isAdmin(c))) throw adminRequired();
}
