import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const photos = sqliteTable(
  "photos",
  {
    id: text("id").primaryKey(),
    caption: text("caption"),
    tribe: text("tribe").notNull(),
    /** "pending" until approved at the booth; only "approved" shows on the wall. */
    status: text("status", { enum: ["pending", "approved"] })
      .notNull()
      .default("pending"),
    objectKey: text("object_key").notNull(),
    contentType: text("content_type").notNull(),
    /** Daily-salted hash of the uploader IP, only used for rate limiting. */
    ipHash: text("ip_hash").notNull(),
    deleteTokenHash: text("delete_token_hash").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    approvedAt: integer("approved_at", { mode: "timestamp_ms" }),
    removedAt: integer("removed_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("photos_created_at_idx").on(table.createdAt),
    index("photos_status_created_at_idx").on(table.status, table.createdAt),
    index("photos_ip_hash_created_at_idx").on(table.ipHash, table.createdAt),
  ],
);

/** Wrong admin passcodes per (daily-salted) client, for lockout. Purged nightly. */
export const authFailures = sqliteTable(
  "auth_failures",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    ipHash: text("ip_hash").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("auth_failures_ip_hash_created_at_idx").on(table.ipHash, table.createdAt)],
);

export type PhotoRow = typeof photos.$inferSelect;
export type NewPhotoRow = typeof photos.$inferInsert;
