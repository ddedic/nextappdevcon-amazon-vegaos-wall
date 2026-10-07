import { bindings, defineConfig, exports, triggers } from "cf/config";

import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

const WORKER_NAME = "nextapp-wall-api";

export default defineConfig({
  worker: {
    name: WORKER_NAME,
    compatibilityDate: "2026-09-25",
    entrypoint,
    domains: ["nextapp-wall-api.dedic.dev"],
    env: {
      DB: bindings.d1({ id: "bd5f5d9b-5315-4a61-a081-7aeba8cd5f69", name: "nextapp-wall" }),
      PHOTOS: bindings.r2({ name: "nextapp-wall-photos" }),
      WALL: bindings.durableObject({ worker: WORKER_NAME, exportName: "WallRoom" }),
      ADMIN_TOKEN: bindings.secret(),
      ALLOWED_ORIGINS: bindings.text("https://nextapp-wall.dedic.dev,http://localhost:5173"),
      RETENTION_DAYS: bindings.text("14"),
    },
    exports: {
      WallRoom: exports.durableObject({ storage: "sqlite" }),
    },
    // Nightly purge of photos past the retention window (GDPR: data minimisation).
    triggers: [triggers.scheduled({ schedule: "17 3 * * *" })],
    observability: { enabled: true },
  },
});
