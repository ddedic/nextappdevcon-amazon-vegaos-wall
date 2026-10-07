/** Photo queries. The only file in this module that talks to D1. */
import type { PhotoStatus } from "@vegaos-demo/shared";
import { and, count, desc, eq, gte, isNull, lt } from "drizzle-orm";

import type { Db } from "@/db/client";
import { type NewPhotoRow, type PhotoRow, photos } from "@/db/schema";

const visible = isNull(photos.removedAt);

export const photoRepo = {
  async findByStatus(db: Db, status: PhotoStatus, limit: number): Promise<PhotoRow[]> {
    return db
      .select()
      .from(photos)
      .where(and(visible, eq(photos.status, status)))
      .orderBy(desc(status === "approved" ? photos.approvedAt : photos.createdAt))
      .limit(limit);
  },

  async findById(db: Db, id: string): Promise<PhotoRow | undefined> {
    const [row] = await db.select().from(photos).where(eq(photos.id, id)).limit(1);
    return row;
  },

  async findCreatedBefore(db: Db, cutoff: Date): Promise<PhotoRow[]> {
    return db.select().from(photos).where(lt(photos.createdAt, cutoff));
  },

  async countRecentByIpHash(db: Db, ipHash: string, since: Date): Promise<number> {
    const [row] = await db
      .select({ value: count() })
      .from(photos)
      .where(and(eq(photos.ipHash, ipHash), gte(photos.createdAt, since)));
    return row?.value ?? 0;
  },

  async countCreatedSince(db: Db, since: Date): Promise<number> {
    const [row] = await db
      .select({ value: count() })
      .from(photos)
      .where(gte(photos.createdAt, since));
    return row?.value ?? 0;
  },

  async countPending(db: Db): Promise<number> {
    const [row] = await db
      .select({ value: count() })
      .from(photos)
      .where(and(visible, eq(photos.status, "pending")));
    return row?.value ?? 0;
  },

  async countApprovedByTribe(db: Db): Promise<{ tribe: string; value: number }[]> {
    return db
      .select({ tribe: photos.tribe, value: count() })
      .from(photos)
      .where(and(visible, eq(photos.status, "approved")))
      .groupBy(photos.tribe);
  },

  async create(db: Db, row: NewPhotoRow): Promise<PhotoRow> {
    const [created] = await db.insert(photos).values(row).returning();
    if (!created) throw new Error("Photo insert returned no row");
    return created;
  },

  async approve(db: Db, id: string, approvedAt: Date): Promise<PhotoRow | undefined> {
    const [row] = await db
      .update(photos)
      .set({ status: "approved", approvedAt })
      .where(and(eq(photos.id, id), visible))
      .returning();
    return row;
  },

  async setRemoved(db: Db, id: string, removedAt: Date): Promise<void> {
    await db.update(photos).set({ removedAt }).where(eq(photos.id, id));
  },

  async deleteById(db: Db, id: string): Promise<void> {
    await db.delete(photos).where(eq(photos.id, id));
  },
};
