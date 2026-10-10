import { app } from "@/app/app";
import type { AppBindings } from "@/core/runtime/bindings";
import { purgeExpiredPhotos } from "@/jobs/purge-expired-photos";

// Composition root: the runtime needs the Durable Object class itself. The barrel only
// exports its type, so tests never load `cloudflare:workers`.
export { WallRoom } from "@/modules/wall/realtime/wall.room";

export default {
  fetch: app.fetch,
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(purgeExpiredPhotos(env));
  },
} satisfies ExportedHandler<AppBindings>;
