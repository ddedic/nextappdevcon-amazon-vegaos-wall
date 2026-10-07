import type { ContentfulStatusCode } from "hono/utils/http-status";

export class ServiceError extends Error {
  constructor(
    readonly status: ContentfulStatusCode,
    readonly code: string,
    readonly messageKey: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(code);
    this.name = "ServiceError";
  }
}

const factory =
  (status: ContentfulStatusCode) =>
  (code: string, details?: Record<string, unknown>, messageKey = code) =>
    new ServiceError(status, code, messageKey, details);

export const badRequest = factory(400);
export const forbidden = factory(403);
export const notFound = factory(404);
export const payloadTooLarge = factory(413);
export const unsupportedMediaType = factory(415);
export const tooManyRequests = factory(429);
export const serviceUnavailable = factory(503);
