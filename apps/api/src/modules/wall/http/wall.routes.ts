import { remoteCommandSchema } from "@boothwall/shared";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { z } from "zod";

import { badRequest } from "@/core/http/errors";
import type { AppEnv } from "@/core/http/http-context";
import { noContent } from "@/core/http/response";
import { requireAdmin } from "@/modules/auth";
import { wallService } from "@/modules/wall/domain/wall.service";

const remoteBodySchema = z.object({ command: remoteCommandSchema });

export const wallRouter = new Hono<AppEnv>()
  .get("/live", (c) => {
    if (c.req.header("upgrade")?.toLowerCase() !== "websocket") {
      throw badRequest("WALL_WEBSOCKET_REQUIRED");
    }
    return wallService.connect(c.env.WALL, c.req.raw);
  })
  // Phone remote for the booth: relays a button press to every connected wall.
  .post(
    "/remote",
    bodyLimit({
      maxSize: 1024,
      onError: () => {
        throw badRequest("WALL_REMOTE_BODY_TOO_LARGE");
      },
    }),
    zValidator("json", remoteBodySchema, (result) => {
      if (!result.success) throw result.error;
    }),
    async (c) => {
      await requireAdmin(c);
      await wallService.broadcaster(c.env.WALL).broadcast({
        type: "remote.command",
        command: c.req.valid("json").command,
      });
      return noContent(c);
    },
  );
