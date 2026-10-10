import { PHOTO_LIMITS, type WallStatsDTO } from "@boothwall/shared";

import { hashClient } from "@/core/security/client-ip";
import { hmacHex, randomToken, safeEqual, sha256Hex } from "@/core/security/crypto";
import type { Db } from "@/db/client";
import type { PhotoRow } from "@/db/schema";
import { photoRepo } from "@/modules/photo/data/photo.repo";
import { photoStorageRepo } from "@/modules/photo/data/photo-storage.repo";
import { readImageSize, sniffImageType } from "@/modules/photo/domain/image-type";

import { photoCursor } from "./photo.cursor";
import {
  photoDeleteForbidden,
  photoNotFound,
  photoRateLimited,
  photoTooBig,
  photoTooLarge,
  photoUnsupportedType,
  photoWallBusy,
} from "./photo.errors";
import { toPhotoDTO, toPhotoStats, toWallStats } from "./photo.formatters";
import type {
  ImageVariant,
  ListPhotosArgs,
  PhotoDeps,
  PhotoDTO,
  PhotoPageDTO,
  PhotoStatsDTO,
  RemovePhotoArgs,
  UpdatePhotoArgs,
  UploadPhotoArgs,
  UploadResultDTO,
  WallSnapshotDTO,
} from "./photo.types";

const DAY_MS = 24 * 60 * 60 * 1000;
/** Twice what the phone sends, so a slightly different client still gets through. */
const MAX_EDGE_PX = PHOTO_LIMITS.maxEdgePx * 2;
const MAX_THUMB_EDGE_PX = PHOTO_LIMITS.thumbEdgePx * 2;

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

/** The image and its thumbnail, if it has one. */
const deleteObjects = async (bucket: R2Bucket, row: PhotoRow) => {
  await photoStorageRepo.delete(bucket, row.objectKey);
  if (row.thumbKey) await photoStorageRepo.delete(bucket, row.thumbKey);
};

const stats = async (db: Db): Promise<WallStatsDTO> =>
  toWallStats(await photoRepo.countApprovedByTribe(db));

/** Cheap checks on the declared type and size, before any limit is counted. */
const precheck = (file: File, maxBytes: number) => {
  if (!(PHOTO_LIMITS.mimeTypes as readonly string[]).includes(file.type)) {
    throw photoUnsupportedType({ type: file.type });
  }
  if (file.size > maxBytes) throw photoTooLarge({ bytes: file.size, maxBytes });
};

/** Reads the real bytes: type from the header, pixel size without decoding. */
const readImage = async (file: File, maxEdgePx: number) => {
  const bytes = await file.arrayBuffer();
  const contentType = sniffImageType(new Uint8Array(bytes, 0, Math.min(bytes.byteLength, 16)));
  if (!contentType) throw photoUnsupportedType({ type: file.type });
  const size = readImageSize(new Uint8Array(bytes), contentType);
  if (!size || size.width < 1 || size.height < 1) throw photoUnsupportedType({ type: contentType });
  if (Math.max(size.width, size.height) > maxEdgePx) throw photoTooBig({ ...size, maxEdgePx });
  return { bytes, contentType };
};

/**
 * Short HMAC so only the Control panel can open images that aren't on the wall (pending or
 * hidden). The message predates hidden photos; keeping it keeps issued links valid.
 */
const privateSignature = async (key: string, id: string) =>
  (await hmacHex(key, `pending-image:${id}`)).slice(0, 32);

/** Control panel view of a row: images that aren't public get a signed link. */
const toControlDTO = async (row: PhotoRow, { origin, signingKey }: PhotoDeps) =>
  toPhotoDTO(
    row,
    origin,
    row.status === "approved" ? undefined : await privateSignature(signingKey, row.id),
  );

export const photoService = {
  /** Approved photos only, i.e. what the TV wall shows. */
  async getWall({ db, origin }: PhotoDeps, limit: number): Promise<WallSnapshotDTO> {
    const rows = await photoRepo.findByStatus(db, "approved", limit);
    return { photos: rows.map((row) => toPhotoDTO(row, origin)), stats: await stats(db) };
  },

  /** Booth view: photos waiting for approval, oldest first so nobody waits too long. */
  async getPending(deps: PhotoDeps, limit: number): Promise<PhotoDTO[]> {
    const rows = await photoRepo.findByStatus(deps.db, "pending", limit);
    return Promise.all(rows.reverse().map((row) => toControlDTO(row, deps)));
  },

  /** Control panel list: every kept photo, filtered, sorted and paged by cursor. */
  async list(deps: PhotoDeps, { cursor, ...filter }: ListPhotosArgs): Promise<PhotoPageDTO> {
    const rows = await photoRepo.list(deps.db, {
      ...filter,
      cursor: cursor ? photoCursor.decode(filter.sort, cursor) : undefined,
      // One extra row says whether there is another page.
      limit: filter.limit + 1,
    });
    const page = rows.slice(0, filter.limit);
    const last = page.at(-1);
    return {
      photos: await Promise.all(page.map((row) => toControlDTO(row, deps))),
      nextCursor:
        rows.length > filter.limit && last
          ? photoCursor.encode(filter.sort, {
              rank: last.rank,
              createdAt: last.createdAt.getTime(),
              id: last.id,
            })
          : null,
    };
  },

  /** Counts for the Control panel's overview; "today" starts at `since`. */
  async stats({ db }: PhotoDeps, since: Date): Promise<PhotoStatsDTO> {
    const [counts, uploadsToday] = await Promise.all([
      photoRepo.countByStatusAndTribe(db),
      photoRepo.countCreatedSince(db, since),
    ]);
    return toPhotoStats(counts, uploadsToday);
  },

  /**
   * Edits from the Control panel. The wall follows live: hiding sends `photo.removed`,
   * showing again sends `photo.created` and an edit to a photo on the wall `photo.updated`.
   * Showing a hidden photo approves it, whether or not it had been approved before.
   */
  async update(deps: PhotoDeps, id: string, patch: UpdatePhotoArgs): Promise<PhotoDTO> {
    const { db, wall } = deps;
    const existing = await photoRepo.findById(db, id);
    if (!existing || existing.removedAt) throw photoNotFound({ id });

    const status =
      patch.hidden === true
        ? "hidden"
        : patch.hidden === false && existing.status === "hidden"
          ? "approved"
          : existing.status;
    const row = await photoRepo.update(db, id, {
      ...(patch.caption !== undefined && { caption: patch.caption }),
      ...(patch.tribe !== undefined && { tribe: patch.tribe }),
      ...(patch.keep !== undefined && { keep: patch.keep }),
      status,
      ...(status === "approved" &&
        !existing.approvedAt && { approvedAt: deps.now?.() ?? new Date() }),
    });
    if (!row) throw photoNotFound({ id });

    const wasOnWall = existing.status === "approved";
    const onWall = row.status === "approved";
    const edited = row.caption !== existing.caption || row.tribe !== existing.tribe;
    if (wasOnWall && !onWall) {
      await wall.broadcast({ type: "photo.removed", photoId: id, stats: await stats(db) });
    } else if (!wasOnWall && onWall) {
      const photo = toPhotoDTO(row, deps.origin);
      await wall.broadcast({ type: "photo.created", photo, stats: await stats(db) });
    } else if (onWall && edited) {
      const photo = toPhotoDTO(row, deps.origin);
      await wall.broadcast({ type: "photo.updated", photo, stats: await stats(db) });
    }
    return toControlDTO(row, deps);
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
    const { image, thumb } = args;

    precheck(image, PHOTO_LIMITS.maxBytes);
    if (thumb) precheck(thumb, PHOTO_LIMITS.thumbMaxBytes);

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

    // The phone sends at most 1080px; anything far bigger is a decode bomb for the TV.
    const { bytes, contentType } = await readImage(image, MAX_EDGE_PX);
    const small = thumb ? await readImage(thumb, MAX_THUMB_EDGE_PX) : undefined;

    const id = crypto.randomUUID();
    const objectKey = `photos/${id}`;
    // Keyed by the photo id, like the image; older rows have no thumbnail.
    const thumbKey = small ? `thumbs/${id}` : null;
    const deleteToken = randomToken();

    await photoStorageRepo.put(bucket, objectKey, bytes, contentType);
    if (small && thumbKey) {
      await photoStorageRepo.put(bucket, thumbKey, small.bytes, small.contentType);
    }
    const row = await photoRepo.create(db, {
      id,
      caption: args.caption,
      tribe: args.tribe,
      status: "pending",
      objectKey,
      contentType,
      thumbKey,
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
    await deleteObjects(bucket, row);
    if (row.status === "approved") {
      await wall.broadcast({ type: "photo.removed", photoId: id, stats: await stats(db) });
    }
  },

  /**
   * Approved images are public; pending and hidden ones need the Control panel's signed link. A thumbnail
   * request for a photo stored without one gets the full image.
   */
  async getImage(
    { db, bucket, signingKey }: PhotoDeps,
    id: string,
    signature: string | undefined,
    variant: ImageVariant = "image",
  ): Promise<{ object: R2ObjectBody; contentType: string; approved: boolean }> {
    const row = await photoRepo.findById(db, id);
    if (!row || row.removedAt) throw photoNotFound({ id });
    const approved = row.status === "approved";
    if (!approved && !(signature && safeEqual(signature, await privateSignature(signingKey, id)))) {
      throw photoNotFound({ id });
    }
    if (variant === "thumb" && row.thumbKey) {
      const thumb = await photoStorageRepo.get(bucket, row.thumbKey);
      const thumbType = thumb?.httpMetadata?.contentType;
      if (thumb && thumbType) return { object: thumb, contentType: thumbType, approved };
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
    const old = await photoRepo.findCreatedBefore(
      db,
      new Date(now.getTime() - retentionDays * DAY_MS),
    );
    const expired = old.filter((row) => !row.keep);
    for (const row of expired) {
      await deleteObjects(bucket, row);
      await photoRepo.deleteById(db, row.id);
    }
    return expired.length;
  },
};
