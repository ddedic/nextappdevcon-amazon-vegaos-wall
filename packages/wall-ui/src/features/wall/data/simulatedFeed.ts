import {
  type PhotoDTO,
  type Tribe,
  TRIBES,
  type WallPhotoEvent,
  type WallSnapshotDTO,
  type WallStatsDTO,
} from "@boothwall/shared";

import { demoPhotos } from "./demoPhotos";

const TRIBE_IDS = Object.keys(TRIBES) as Tribe[];

/** For demo photos whose category isn't in the config: earlier categories get more photos. */
const WEIGHTED_TRIBES = TRIBE_IDS.flatMap((id, index) =>
  Array<Tribe>(TRIBE_IDS.length - index).fill(id),
);

let counter = 0;

function simulatedPhoto(minutesAgo = 0): PhotoDTO {
  counter += 1;
  const pool = demoPhotos();
  const demo = pool[counter % pool.length];
  const fallback =
    WEIGHTED_TRIBES[(counter * 7) % WEIGHTED_TRIBES.length] ?? (TRIBE_IDS[0] as Tribe);
  const tribe = demo && demo.category in TRIBES ? (demo.category as Tribe) : fallback;
  return {
    id: `sim-${counter}`,
    status: "approved",
    caption: demo?.caption ?? null,
    tribe,
    imageUrl: demo?.full ?? "",
    thumbUrl: demo?.thumb ?? "",
    createdAt: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
  };
}

function statsFor(photos: PhotoDTO[]): WallStatsDTO {
  const byTribe: WallStatsDTO["byTribe"] = {};
  for (const photo of photos) byTribe[photo.tribe] = (byTribe[photo.tribe] ?? 0) + 1;
  return { total: photos.length, byTribe };
}

export function simulatedSnapshot(count: number): WallSnapshotDTO {
  const photos = Array.from({ length: count }, (_, i) => simulatedPhoto(count - i)).reverse();
  return { photos, stats: statsFor(photos) };
}

export function startSimulatedEvents(
  initial: PhotoDTO[],
  everyMs: number,
  emit: (event: WallPhotoEvent) => void,
): () => void {
  // Running totals rather than a list of every photo: a demo left on all day must not grow.
  const stats = statsFor(initial);
  const timer = setInterval(() => {
    const photo = simulatedPhoto();
    stats.total += 1;
    stats.byTribe[photo.tribe] = (stats.byTribe[photo.tribe] ?? 0) + 1;
    emit({
      type: "photo.created",
      photo,
      stats: { total: stats.total, byTribe: { ...stats.byTribe } },
    });
  }, everyMs);
  return () => clearInterval(timer);
}
