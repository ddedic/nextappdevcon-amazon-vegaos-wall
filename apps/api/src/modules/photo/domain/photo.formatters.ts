import {
  type PhotoDTO,
  photoStatusSchema,
  type Tribe,
  tribeSchema,
  type WallStatsDTO,
} from "@vegaos-demo/shared";

import type { PhotoRow } from "@/db/schema";

export const toPhotoDTO = (row: PhotoRow, origin: string, signature?: string): PhotoDTO => ({
  id: row.id,
  status: photoStatusSchema.parse(row.status),
  caption: row.caption,
  tribe: tribeSchema.parse(row.tribe),
  imageUrl: `${origin}/photos/${row.id}/image${signature ? `?sig=${signature}` : ""}`,
  createdAt: row.createdAt.toISOString(),
});

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
