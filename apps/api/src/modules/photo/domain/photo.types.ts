import type {
  PhotoDTO,
  Tribe,
  UploadResultDTO,
  WallEvent,
  WallSnapshotDTO,
} from "@vegaos-demo/shared";

import type { Db } from "@/db/client";

export type { PhotoDTO, UploadResultDTO, WallSnapshotDTO };

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
  caption: string | null;
  tribe: Tribe;
  clientIp: string;
};

export type RemovePhotoArgs = {
  id: string;
  deleteToken?: string;
  isAdmin: boolean;
};
