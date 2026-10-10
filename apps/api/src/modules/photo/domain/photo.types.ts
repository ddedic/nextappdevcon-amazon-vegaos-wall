import type {
  PhotoDTO,
  PhotoPageDTO,
  PhotoSort,
  PhotoStatsDTO,
  PhotoStatus,
  Tribe,
  UploadResultDTO,
  WallEvent,
  WallSnapshotDTO,
} from "@boothwall/shared";

import type { Db } from "@/db/client";

export type { PhotoDTO, PhotoPageDTO, PhotoStatsDTO, UploadResultDTO, WallSnapshotDTO };

/** Pushes realtime events to connected walls (implemented by the wall module). */
export type WallBroadcaster = {
  broadcast(event: WallEvent): Promise<void>;
};

/** Per-request collaborators; built from Worker bindings in the routes. */
export type PhotoDeps = {
  db: Db;
  bucket: R2Bucket;
  wall: WallBroadcaster;
  /** Public origin of this API, used to build absolute image URLs. */
  origin: string;
  /** Secret that signs links to images still waiting for approval. */
  signingKey: string;
  now?: () => Date;
};

export type UploadPhotoArgs = {
  image: File;
  /** Optional small copy for wall cards; checked like the image. */
  thumb?: File;
  caption: string | null;
  tribe: Tribe;
  clientIp: string;
};

export type RemovePhotoArgs = {
  id: string;
  deleteToken?: string;
  isAdmin: boolean;
};

/** Which stored copy an image request wants. */
export type ImageVariant = "image" | "thumb";

/** Where the previous page of the Control panel's list ended. */
export type PhotoCursor = {
  /** Category position in the config; only used by the "category" sort. */
  rank: number;
  createdAt: number;
  id: string;
};

export type PhotoListFilter = {
  status?: PhotoStatus;
  tribe?: Tribe;
  q?: string;
  sort: PhotoSort;
  cursor?: PhotoCursor;
  limit: number;
};

export type ListPhotosArgs = Omit<PhotoListFilter, "cursor"> & {
  /** Opaque cursor from the previous page. */
  cursor?: string;
};

export type UpdatePhotoArgs = {
  caption?: string | null;
  tribe?: Tribe;
  /** true takes the photo off the wall; false puts a hidden one back. */
  hidden?: boolean;
  /** true exempts the photo from retention. */
  keep?: boolean;
};
