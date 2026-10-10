import {
  type PhotoDTO,
  type PhotoStatsDTO,
  type PhotoStatus,
  photoStatusSchema,
  type Tribe,
  tribeSchema,
  type WallStatsDTO,
} from "@boothwall/shared";

import type { PhotoRow } from "@/db/schema";

export const toPhotoDTO = (row: PhotoRow, origin: string, signature?: string): PhotoDTO => {
  const url = (variant: "image" | "thumb") =>
    `${origin}/photos/${row.id}/${variant}${signature ? `?sig=${signature}` : ""}`;
  return {
    id: row.id,
    status: photoStatusSchema.parse(row.status),
    caption: row.caption,
    tribe: tribeSchema.parse(row.tribe),
    imageUrl: url("image"),
    // Photos stored before thumbnails existed fall back to the full image.
    thumbUrl: url(row.thumbKey ? "thumb" : "image"),
    createdAt: row.createdAt.toISOString(),
  };
};

export const toWallStats = (counts: { tribe: string; value: number }[]): WallStatsDTO => {
  const byTribe: Partial<Record<Tribe, number>> = {};
  let total = 0;
  for (const { tribe, value } of counts) {
    const parsed = tribeSchema.safeParse(tribe);
    if (parsed.success) byTribe[parsed.data] = value;
    total += value;
  }
  return { total, byTribe };
};

const STAT_KEYS = { approved: "onWall", pending: "pending", hidden: "hidden" } as const;

export const toPhotoStats = (
  counts: { status: PhotoStatus; tribe: string; value: number }[],
  uploadsToday: number,
): PhotoStatsDTO => {
  const totals = { onWall: 0, pending: 0, hidden: 0 };
  const byTribe: PhotoStatsDTO["byTribe"] = {};
  for (const { status, tribe, value } of counts) {
    const key = STAT_KEYS[status];
    totals[key] += value;
    const parsed = tribeSchema.safeParse(tribe);
    if (!parsed.success) continue;
    const entry = (byTribe[parsed.data] ??= { onWall: 0, pending: 0, hidden: 0 });
    entry[key] += value;
  }
  return { ...totals, uploadsToday, byTribe };
};
