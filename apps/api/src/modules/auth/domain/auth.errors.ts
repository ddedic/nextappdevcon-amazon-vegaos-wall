import { forbidden, tooManyRequests } from "@/core/http/errors";

export const ADMIN_REQUIRED = "ADMIN_REQUIRED" as const;
export const ADMIN_LOCKED = "ADMIN_LOCKED" as const;

export const adminRequired = () => forbidden(ADMIN_REQUIRED);

export const adminLocked = (details: { retryAfterSeconds: number }) =>
  tooManyRequests(ADMIN_LOCKED, details, "auth.locked");
