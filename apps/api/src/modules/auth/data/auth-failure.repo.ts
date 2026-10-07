/** Failed admin attempts. The only file in this module that talks to D1. */
import { and, count, eq, gte, lt } from "drizzle-orm";

import type { Db } from "@/db/client";
import { authFailures } from "@/db/schema";

export const authFailureRepo = {
  async countSince(db: Db, ipHash: string, since: Date): Promise<number> {
    const [row] = await db
      .select({ value: count() })
      .from(authFailures)
      .where(and(eq(authFailures.ipHash, ipHash), gte(authFailures.createdAt, since)));
    return row?.value ?? 0;
  },

  async add(db: Db, ipHash: string, createdAt: Date): Promise<void> {
    await db.insert(authFailures).values({ ipHash, createdAt });
  },

  async deleteBefore(db: Db, cutoff: Date): Promise<void> {
    await db.delete(authFailures).where(lt(authFailures.createdAt, cutoff));
  },
};
