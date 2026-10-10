import type { WallEvent, WallSnapshotDTO } from "@boothwall/shared";

import { LIVE_FEED_LIMIT } from "@/features/wall/constants/feed";

/** Folds one realtime event into the phone feed: newest first, capped, no duplicates. */
export function applyWallEvent(snapshot: WallSnapshotDTO, event: WallEvent): WallSnapshotDTO {
  switch (event.type) {
    case "photo.created": {
      const rest = snapshot.photos.filter((photo) => photo.id !== event.photo.id);
      return { photos: [event.photo, ...rest].slice(0, LIVE_FEED_LIMIT), stats: event.stats };
    }
    case "photo.updated":
      return {
        photos: snapshot.photos.map((photo) => (photo.id === event.photo.id ? event.photo : photo)),
        stats: event.stats,
      };
    case "photo.removed":
      return {
        photos: snapshot.photos.filter((photo) => photo.id !== event.photoId),
        stats: event.stats,
      };
    case "remote.command":
      return snapshot;
  }
}
