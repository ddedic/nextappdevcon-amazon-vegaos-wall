/** Photo queries. The only file in this module that talks to D1. */
import { type PhotoStatus, tribeSchema } from "@boothwall/shared";
import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  gt,
  gte,
  isNull,
  lt,
  or,
  type SQL,
  sql,
} from "drizzle-orm";

import type { Db } from "@/db/client";
import { type NewPhotoRow, type PhotoRow, photos } from "@/db/schema";
import type { PhotoCursor, PhotoListFilter } from "@/modules/photo/domain/photo.types";

const visible = isNull(photos.removedAt);

/** Category position in the config, so "sort by category" follows the phone's picker. */
const categoryRank = sql<number>`CASE ${photos.tribe} ${sql.join(
  tribeSchema.options.map((id, rank) => sql`WHEN ${id} THEN ${rank}`),
  sql` `,
)} ELSE ${tribeSchema.options.length} END`;

/** `%` and `_` in a search are literal characters, not wildcards. */
const containing = (text: string) => `%${text.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;

/** Rows after the cursor, in the same order the page was sorted by. */
const after = (sort: PhotoListFilter["sort"], cursor: PhotoCursor): SQL | undefined => {
  const at = new Date(cursor.createdAt);
  if (sort === "oldest") {
    return or(gt(photos.createdAt, at), and(eq(photos.createdAt, at), gt(photos.id, cursor.id)));
  }
  const newer = or(
    lt(photos.createdAt, at),
    and(eq(photos.createdAt, at), lt(photos.id, cursor.id)),
  );
  if (sort === "newest") return newer;
  return or(
    sql`${categoryRank} > ${cursor.rank}`,
    and(sql`${categoryRank} = ${cursor.rank}`, newer),
  );
};

const orderFor = (sort: PhotoListFilter["sort"]) => {
  if (sort === "oldest") return [asc(photos.createdAt), asc(photos.id)];
  const newest = [desc(photos.createdAt), desc(photos.id)];
  return sort === "category" ? [asc(categoryRank), ...newest] : newest;
};

export const photoRepo = {
  async findByStatus(db: Db, status: PhotoStatus, limit: number): Promise<PhotoRow[]> {
    return db
      .select()
      .from(photos)
      .where(and(visible, eq(photos.status, status)))
      .orderBy(desc(status === "approved" ? photos.approvedAt : photos.createdAt))
      .limit(limit);
  },

  /** Control panel list: one page in a stable order, plus its last row's category rank. */
  async list(db: Db, filter: PhotoListFilter): Promise<(PhotoRow & { rank: number })[]> {
    const { status, tribe, q, sort, cursor, limit } = filter;
    return db
      .select({ ...getTableColumns(photos), rank: categoryRank })
      .from(photos)
      .where(
        and(
          visible,
          status ? eq(photos.status, status) : undefined,
          tribe ? eq(photos.tribe, tribe) : undefined,
          q ? sql`${photos.caption} LIKE ${containing(q)} ESCAPE '\\'` : undefined,
          cursor ? after(sort, cursor) : undefined,
        ),
      )
      .orderBy(...orderFor(sort))
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

  /** Every photo still kept, counted per status and category. */
  async countByStatusAndTribe(
    db: Db,
  ): Promise<{ status: PhotoStatus; tribe: string; value: number }[]> {
    return db
      .select({ status: photos.status, tribe: photos.tribe, value: count() })
      .from(photos)
      .where(visible)
      .groupBy(photos.status, photos.tribe);
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

  async update(
    db: Db,
    id: string,
    values: Partial<Pick<PhotoRow, "caption" | "tribe" | "status" | "approvedAt" | "keep">>,
  ): Promise<PhotoRow | undefined> {
    const [row] = await db
      .update(photos)
      .set(values)
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
