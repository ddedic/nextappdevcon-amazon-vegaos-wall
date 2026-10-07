import { afterEach, describe, expect, it, vi } from "vitest";

import type { Db } from "@/db/client";
import { authFailureRepo } from "@/modules/auth/data/auth-failure.repo";

import { ADMIN_LOCKOUT, adminGuardService } from "./admin-guard.service";
import { ADMIN_LOCKED } from "./auth.errors";

const attempt = (token: string) => ({
  db: {} as Db,
  token,
  adminToken: "right-passcode",
  clientIp: "203.0.113.7",
  now: new Date("2026-10-08T09:00:00.000Z"),
});

afterEach(() => vi.restoreAllMocks());

describe("adminGuardService.verify", () => {
  it("counts wrong passcodes and locks the client out after too many", async () => {
    vi.spyOn(authFailureRepo, "countSince").mockResolvedValue(0);
    const add = vi.spyOn(authFailureRepo, "add").mockResolvedValue();

    await expect(adminGuardService.verify(attempt("right-passcode"))).resolves.toBe(true);
    await expect(adminGuardService.verify(attempt("guess"))).resolves.toBe(false);
    expect(add).toHaveBeenCalledOnce();

    vi.spyOn(authFailureRepo, "countSince").mockResolvedValue(ADMIN_LOCKOUT.maxFailures);
    // Locked out: even the right passcode is refused until the window passes.
    await expect(adminGuardService.verify(attempt("right-passcode"))).rejects.toMatchObject({
      code: ADMIN_LOCKED,
      status: 429,
    });
  });
});
