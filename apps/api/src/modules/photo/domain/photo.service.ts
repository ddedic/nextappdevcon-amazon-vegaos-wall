import { PHOTO_LIMITS, type WallStatsDTO } from "@vegaos-demo/shared";

import { hashClient } from "@/core/security/client-ip";
import { hmacHex, randomToken, safeEqual, sha256Hex } from "@/core/security/crypto";
import type { Db } from "@/db/client";
import { photoRepo } from "@/modules/photo/data/photo.repo";
import { photoStorageRepo } from "@/modules/photo/data/photo-storage.repo";
import { readImageSize, sniffImageType } from "@/modules/photo/domain/image-type";

import {
  photoDeleteForbidden,
  photoNotFound,
  photoRateLimited,
  photoTooBig,
  photoTooLarge,
  photoUnsupportedType,
  photoWallBusy,
} from "./photo.errors";
import { toPhotoDTO, toWallStats } from "./photo.formatters";
import type {
  PhotoDeps,
  PhotoDTO,
  RemovePhotoArgs,
  UploadPhotoArgs,
  UploadResultDTO,
  WallSnapshotDTO,
} from "./photo.types";

const DAY_MS = 24 * 60 * 60 * 1000;
/** Twice what the phone sends, so a slightly different client still gets through. */
const MAX_EDGE_PX = PHOTO_LIMITS.maxEdgePx * 2;

/**
 * Upload limits, sized for venue Wi-Fi where hundreds of people share one IP: the
 * per-client caps only stop scripts. The global caps bound storage and cost no matter how
 * many IPs an abuser has (5,000 photos of at most 3 MB is under 15 GB, cents on R2).
 */
export const UPLOAD_LIMITS = {
  perClient: { maxUploads: 60, windowMs: 10 * 60 * 1000 },
  perClientDaily: 500,
  globalDaily: 5000,
  maxPending: 300,
};

const stats = async (db: Db): Promise<WallStatsDTO> =>
  toWallStats(await photoRepo.countApprovedByTribe(db));

/** Short HMAC so only the admin page can open images that aren't approved yet. */
const pendingSignature = async (key: string, id: string) =>
  (await hmacHex(key, `pending-image:${id}`)).slice(0, 32);

export const photoService = {
  /** Approved photos only, i.e. what the TV wall shows. */
  async getWall({ db, origin }: PhotoDeps, limit: number): Promise<WallSnapshotDTO> {
    const rows = await photoRepo.findByStatus(db, "approved", limit);
    return { photos: rows.map((row) => toPhotoDTO(row, origin)), stats: await stats(db) };
  },

  /** Booth view: photos waiting for approval, oldest first so nobody waits too long. */
  async getPending({ db, origin, signingKey }: PhotoDeps, limit: number): Promise<PhotoDTO[]> {
    const rows = await photoRepo.findByStatus(db, "pending", limit);
    return Promise.all(
      rows
        .reverse()
        .map(async (row) => toPhotoDTO(row, origin, await pendingSignature(signingKey, row.id))),
    );
  },

  async approve(deps: PhotoDeps, id: string): Promise<PhotoDTO> {
    const { db, wall, origin } = deps;
    const existing = await photoRepo.findById(db, id);
    if (!existing || existing.removedAt) throw photoNotFound({ id });
    if (existing.status === "approved") return toPhotoDTO(existing, origin);

    const row = await photoRepo.approve(db, id, deps.now?.() ?? new Date());
    if (!row) throw photoNotFound({ id });
    const photo = toPhotoDTO(row, origin);
    await wall.broadcast({ type: "photo.created", photo, stats: await stats(db) });
    return photo;
  },

  async upload(deps: PhotoDeps, args: UploadPhotoArgs): Promise<UploadResultDTO> {
    const { db, bucket, origin } = deps;
    const now = deps.now?.() ?? new Date();
    const { image } = args;

    if (!(PHOTO_LIMITS.mimeTypes as readonly string[]).includes(image.type)) {
      throw photoUnsupportedType({ type: image.type });
    }
    if (image.size > PHOTO_LIMITS.maxBytes) {
      throw photoTooLarge({ bytes: image.size, maxBytes: PHOTO_LIMITS.maxBytes });
    }

    const ipHash = await hashClient(args.clientIp, now);
    const { perClient } = UPLOAD_LIMITS;
    const burst = await photoRepo.countRecentByIpHash(
      db,
      ipHash,
      new Date(now.getTime() - perClient.windowMs),
    );
    if (burst >= perClient.maxUploads) {
      throw photoRateLimited({ retryAfterSeconds: perClient.windowMs / 1000 });
    }
    const dayAgo = new Date(now.getTime() - DAY_MS);
    if ((await photoRepo.countRecentByIpHash(db, ipHash, dayAgo)) >= UPLOAD_LIMITS.perClientDaily) {
      throw photoRateLimited({ retryAfterSeconds: DAY_MS / 1000 });
    }
    if (
      (await photoRepo.countPending(db)) >= UPLOAD_LIMITS.maxPending ||
      (await photoRepo.countCreatedSince(db, dayAgo)) >= UPLOAD_LIMITS.globalDaily
    ) {
      throw photoWallBusy({ retryAfterSeconds: 15 * 60 });
    }

    const bytes = await image.arrayBuffer();
    const contentType = sniffImageType(new Uint8Array(bytes, 0, Math.min(bytes.byteLength, 16)));
    if (!contentType) throw photoUnsupportedType({ type: image.type });
    // The phone sends at most 1080px; anything far bigger is a decode bomb for the TV.
    const size = readImageSize(new Uint8Array(bytes), contentType);
    if (!size || size.width < 1 || size.height < 1)
      throw photoUnsupportedType({ type: contentType });
    if (Math.max(size.width, size.height) > MAX_EDGE_PX) {
      throw photoTooBig({ ...size, maxEdgePx: MAX_EDGE_PX });
    }

    const id = crypto.randomUUID();
    const objectKey = `photos/${id}`;
    const deleteToken = randomToken();

    await photoStorageRepo.put(bucket, objectKey, bytes, contentType);
    const row = await photoRepo.create(db, {
      id,
      caption: args.caption,
      tribe: args.tribe,
      status: "pending",
      objectKey,
      contentType,
      ipHash,
      deleteTokenHash: await sha256Hex(deleteToken),
      createdAt: now,
    });

    // Not broadcast yet: it reaches the wall when the booth approves it.
    return { photo: toPhotoDTO(row, origin), deleteToken };
  },

  async remove(deps: PhotoDeps, { id, deleteToken, isAdmin }: RemovePhotoArgs): Promise<void> {
    const { db, bucket, wall } = deps;
    const row = await photoRepo.findById(db, id);
    if (!row || row.removedAt) throw photoNotFound({ id });

    const ownerOk =
      deleteToken !== undefined && safeEqual(await sha256Hex(deleteToken), row.deleteTokenHash);
    if (!isAdmin && !ownerOk) throw photoDeleteForbidden({ id });

    await photoRepo.setRemoved(db, id, deps.now?.() ?? new Date());
    await photoStorageRepo.delete(bucket, row.objectKey);
    if (row.status === "approved") {
      await wall.broadcast({ type: "photo.removed", photoId: id, stats: await stats(db) });
    }
  },

  /** Approved images are public; pending ones need the admin page's signed link. */
  async getImage(
    { db, bucket, signingKey }: PhotoDeps,
    id: string,
    signature: string | undefined,
  ): Promise<{ object: R2ObjectBody; contentType: string; approved: boolean }> {
    const row = await photoRepo.findById(db, id);
    if (!row || row.removedAt) throw photoNotFound({ id });
    const approved = row.status === "approved";
    if (!approved && !(signature && safeEqual(signature, await pendingSignature(signingKey, id)))) {
      throw photoNotFound({ id });
    }
    const object = await photoStorageRepo.get(bucket, row.objectKey);
    if (!object) throw photoNotFound({ id });
    return { object, contentType: row.contentType, approved };
  },

  /** Hard-deletes photos (row + image) older than the retention window. Idempotent. */
  async purgeExpired(
    { db, bucket }: Pick<PhotoDeps, "db" | "bucket">,
    { retentionDays, now = new Date() }: { retentionDays: number; now?: Date },
  ): Promise<number> {
    const expired = await photoRepo.findCreatedBefore(
      db,
      new Date(now.getTime() - retentionDays * DAY_MS),
    );
    for (const row of expired) {
      await photoStorageRepo.delete(bucket, row.objectKey);
      await photoRepo.deleteById(db, row.id);
    }
    return expired.length;
  },
};
