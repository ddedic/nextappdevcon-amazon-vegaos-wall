import { boothwallConfig } from "./config/boothwall.config";
import { boothwallConfigSchema } from "./config/boothwall.schema";

// Fail the build, not the booth: every app imports this package, so a broken config throws.
boothwallConfigSchema.parse(boothwallConfig);

export { boothwallConfig };
export { type BoothwallConfig, boothwallConfigSchema } from "./config/boothwall.schema";
export { contrast, readableOn, textOn, withAlpha } from "./config/color";
export { EVENT, SHOWCASE_LABEL } from "./config/event";
export {
  PHOTO_PAGE_MAX,
  type PhotoListQuery,
  photoListQuerySchema,
  type PhotoPageDTO,
  photoPageSchema,
  type PhotoPatch,
  photoPatchSchema,
  type PhotoSort,
  photoSortSchema,
  type PhotoStatsDTO,
  photoStatsQuerySchema,
  photoStatsSchema,
} from "./control/photo-control.schemas";
export {
  captionSchema,
  PHOTO_LIMITS,
  type PhotoDTO,
  photoSchema,
  type PhotoStatus,
  photoStatusSchema,
  type UploadResultDTO,
  uploadResultSchema,
  type WallSnapshotDTO,
  wallSnapshotSchema,
  type WallStatsDTO,
  wallStatsSchema,
} from "./wall/photo.schemas";
export { CATCH_ALL_TRIBE, type Tribe, TRIBES, tribeSchema } from "./wall/tribes";
export {
  type RemoteCommand,
  remoteCommandSchema,
  type WallEvent,
  wallEventSchema,
  type WallPhotoEvent,
} from "./wall/wall-events.schemas";
