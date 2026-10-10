import { bindings, defineConfig, exports, triggers } from "cf/config";

import { boothwallConfig } from "../../packages/shared/src/config/boothwall.config.ts";
import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

const { deploy, urls, retentionDays } = boothwallConfig;
const WORKER_NAME = `${deploy.name}-api`;
// Stand-in D1 id for local dev before `pnpm boothwall setup` creates the real database.
// Keep in sync with scripts/boothwall/commands/migrate.mjs.
const LOCAL_D1_ID = "00000000-0000-4000-8000-000000000000";

/** The API Worker. Names and ids come from the `deploy` section of boothwall.config.ts. */
export default defineConfig({
  worker: {
    name: WORKER_NAME,
    compatibilityDate: "2026-09-25",
    entrypoint,
    ...(deploy.apiDomain ? { domains: [deploy.apiDomain] } : { workersDev: true }),
    env: {
      DB: bindings.d1({ id: deploy.d1DatabaseId || LOCAL_D1_ID, name: deploy.name }),
      PHOTOS: bindings.r2({ name: `${deploy.name}-photos` }),
      WALL: bindings.durableObject({ worker: WORKER_NAME, exportName: "WallRoom" }),
      ADMIN_TOKEN: bindings.secret(),
      ALLOWED_ORIGINS: bindings.text(`${urls.web},http://localhost:5173`),
      RETENTION_DAYS: bindings.text(String(retentionDays)),
    },
    exports: {
      WallRoom: exports.durableObject({ storage: "sqlite" }),
    },
    // Nightly purge of photos past the retention window (GDPR: data minimisation).
    triggers: [triggers.scheduled({ schedule: "17 3 * * *" })],
    observability: { enabled: true },
  },
});
