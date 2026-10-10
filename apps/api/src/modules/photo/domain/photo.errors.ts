import {
  badRequest,
  forbidden,
  notFound,
  payloadTooLarge,
  serviceUnavailable,
  tooManyRequests,
  unsupportedMediaType,
} from "@/core/http/errors";

export const PHOTO_NOT_FOUND = "PHOTO_NOT_FOUND" as const;
export const PHOTO_DELETE_FORBIDDEN = "PHOTO_DELETE_FORBIDDEN" as const;
export const PHOTO_TOO_LARGE = "PHOTO_TOO_LARGE" as const;
export const PHOTO_DIMENSIONS_TOO_LARGE = "PHOTO_DIMENSIONS_TOO_LARGE" as const;
export const PHOTO_UNSUPPORTED_TYPE = "PHOTO_UNSUPPORTED_TYPE" as const;
export const PHOTO_RATE_LIMITED = "PHOTO_RATE_LIMITED" as const;
export const PHOTO_WALL_BUSY = "PHOTO_WALL_BUSY" as const;
export const PHOTO_HOTLINK_FORBIDDEN = "PHOTO_HOTLINK_FORBIDDEN" as const;
export const PHOTO_CURSOR_INVALID = "PHOTO_CURSOR_INVALID" as const;

export const photoNotFound = (details: { id: string }) =>
  notFound(PHOTO_NOT_FOUND, details, "photo.notFound");

export const photoDeleteForbidden = (details: { id: string }) =>
  forbidden(PHOTO_DELETE_FORBIDDEN, details, "photo.deleteForbidden");

export const photoTooLarge = (details: { bytes: number; maxBytes: number }) =>
  payloadTooLarge(PHOTO_TOO_LARGE, details, "photo.tooLarge");

export const photoUnsupportedType = (details: { type: string }) =>
  unsupportedMediaType(PHOTO_UNSUPPORTED_TYPE, details, "photo.unsupportedType");

export const photoRateLimited = (details: { retryAfterSeconds: number }) =>
  tooManyRequests(PHOTO_RATE_LIMITED, details, "photo.rateLimited");

/** Global caps reached: protects storage and the booth queue, whoever is uploading. */
export const photoWallBusy = (details: { retryAfterSeconds: number }) =>
  serviceUnavailable(PHOTO_WALL_BUSY, details, "photo.wallBusy");

export const photoHotlinkForbidden = () =>
  forbidden(PHOTO_HOTLINK_FORBIDDEN, undefined, "photo.hotlinkForbidden");

export const photoTooBig = (details: { width: number; height: number; maxEdgePx: number }) =>
  payloadTooLarge(PHOTO_DIMENSIONS_TOO_LARGE, details, "photo.dimensionsTooLarge");

/** A list cursor that wasn't issued for this sort (or was tampered with). */
export const photoCursorInvalid = () =>
  badRequest(PHOTO_CURSOR_INVALID, undefined, "photo.cursorInvalid");
