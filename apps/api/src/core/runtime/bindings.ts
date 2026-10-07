import type { WallRoom } from "@/modules/wall";

/** Worker bindings, mirroring cloudflare.config.ts. */
export type AppBindings = {
  DB: D1Database;
  PHOTOS: R2Bucket;
  WALL: DurableObjectNamespace<WallRoom>;
  ADMIN_TOKEN: string;
  ALLOWED_ORIGINS: string;
  RETENTION_DAYS: string;
};
