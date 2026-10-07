import {
  type PhotoDTO,
  type Tribe,
  TRIBES,
  type WallPhotoEvent,
  type WallSnapshotDTO,
  type WallStatsDTO,
} from "@vegaos-demo/shared";

const CAPTIONS = [
  "Hello Berlin! 👋",
  "First time at devCon",
  "Coffee #3 and counting",
  "Team photo!",
  "Talk was 🔥",
  "Hermes go brrr",
  "Shipping on Fire TV today",
  "Where's the afterparty?",
  "Hot reload > cold coffee",
  "Hi mom, I'm on TV",
  "Stage 7 was packed",
  "Kotlin + RN = ❤️",
  null,
  "Flutter crew in the house",
  "Swift squad reporting",
  "Ask me about Vega OS",
  null,
  "Best booth award goes to…",
];

const TRIBE_IDS = Object.keys(TRIBES) as Tribe[];

let counter = 0;

export function simulatedPhoto(minutesAgo = 0): PhotoDTO {
  counter += 1;
  return {
    id: `sim-${counter}`,
    status: "approved",
    caption: CAPTIONS[counter % CAPTIONS.length] ?? null,
    tribe: TRIBE_IDS[(counter * 7) % TRIBE_IDS.length] ?? "other",
    imageUrl: `https://picsum.photos/seed/devcon-${counter}/400/400`,
    createdAt: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
  };
}

export function statsFor(photos: PhotoDTO[]): WallStatsDTO {
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
  const photos = [...initial];
  const timer = setInterval(() => {
    const photo = simulatedPhoto();
    photos.unshift(photo);
    emit({ type: "photo.created", photo, stats: statsFor(photos) });
  }, everyMs);
  return () => clearInterval(timer);
}
