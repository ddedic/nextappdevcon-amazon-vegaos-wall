import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const photos = sqliteTable(
  "photos",
  {
    id: text("id").primaryKey(),
    caption: text("caption"),
    tribe: text("tribe").notNull(),
    /**
     * "pending" until approved at the booth; only "approved" shows on the wall. "hidden" is
     * taken off the wall from the Control panel but kept.
     */
    status: text("status", { enum: ["pending", "approved", "hidden"] })
      .notNull()
      .default("pending"),
    objectKey: text("object_key").notNull(),
    contentType: text("content_type").notNull(),
    /** Small JPEG for wall cards; null for photos stored before thumbnails existed. */
    thumbKey: text("thumb_key"),
    /** Daily-salted hash of the uploader IP, only used for rate limiting. */
    ipHash: text("ip_hash").notNull(),
    deleteTokenHash: text("delete_token_hash").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    approvedAt: integer("approved_at", { mode: "timestamp_ms" }),
    removedAt: integer("removed_at", { mode: "timestamp_ms" }),
    /** Exempt from retention, e.g. a demo wall's starter photos. Set through PATCH. */
    keep: integer("keep", { mode: "boolean" }).notNull().default(false),
  },
  (table) => [
    index("photos_created_at_idx").on(table.createdAt),
    index("photos_status_created_at_idx").on(table.status, table.createdAt),
    index("photos_ip_hash_created_at_idx").on(table.ipHash, table.createdAt),
    // The Control panel filters and sorts by category.
    index("photos_tribe_created_at_idx").on(table.tribe, table.createdAt),
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
