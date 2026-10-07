import { hashClient } from "@/core/security/client-ip";
import { safeEqual } from "@/core/security/crypto";
import type { Db } from "@/db/client";
import { authFailureRepo } from "@/modules/auth/data/auth-failure.repo";

import { adminLocked } from "./auth.errors";

/** 10 wrong passcodes in 15 minutes locks that client out for the rest of the window. */
export const ADMIN_LOCKOUT = { maxFailures: 10, windowMs: 15 * 60 * 1000 };
const DAY_MS = 24 * 60 * 60 * 1000;

export type AdminAttempt = {
  db: Db;
  /** Bearer token from the request, or "" when none was sent. */
  token: string;
  adminToken: string;
  clientIp: string;
  now: Date;
};

export const adminGuardService = {
  /** True for the right passcode. Wrong ones are counted; a locked-out client is refused. */
  async verify({ db, token, adminToken, clientIp, now }: AdminAttempt): Promise<boolean> {
    if (!token) return false;
    const ipHash = await hashClient(clientIp, now);
    const since = new Date(now.getTime() - ADMIN_LOCKOUT.windowMs);
    if ((await authFailureRepo.countSince(db, ipHash, since)) >= ADMIN_LOCKOUT.maxFailures) {
      throw adminLocked({ retryAfterSeconds: ADMIN_LOCKOUT.windowMs / 1000 });
    }
    if (safeEqual(token, adminToken)) return true;
    await authFailureRepo.add(db, ipHash, now);
    return false;
  },

  purge(db: Db, now: Date): Promise<void> {
    return authFailureRepo.deleteBefore(db, new Date(now.getTime() - DAY_MS));
  },
};
