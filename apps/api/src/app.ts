import { Hono } from "hono";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { ZodError } from "zod";

import { readConfig } from "@/config/env";
import { ServiceError } from "@/core/http/errors";
import type { AppEnv } from "@/core/http/http-context";
import { errorBody, ok } from "@/core/http/response";
import { photoRouter } from "@/modules/photo";
import { wallRouter } from "@/modules/wall";

export const app = new Hono<AppEnv>()
  .use(requestId())
  // CORP is left to each route: the TV's native image loader enforces it like a browser.
  .use(secureHeaders({ crossOriginResourcePolicy: false }))
  .use(async (c, next) => {
    c.set("config", readConfig(c.env));
    await next();
  })
  .use((c, next) =>
    cors({
      origin: c.get("config").ALLOWED_ORIGINS,
      allowMethods: ["GET", "POST", "DELETE"],
      allowHeaders: ["authorization", "content-type", "x-delete-token"],
    })(c, next),
  )
  .get("/health", (c) => ok(c, { status: "ok" }))
  .route("/photos", photoRouter)
  .route("/wall", wallRouter);

app.onError((err, c) => {
  if (err instanceof ServiceError) {
    return c.json(errorBody(err.code, err.messageKey, err.details), err.status);
  }
  if (err instanceof ZodError) {
    return c.json(errorBody("VALIDATION_FAILED", "common.validationFailed", err.issues), 400);
  }
  console.error(err);
  return c.json(errorBody("INTERNAL", "common.internal"), 500);
});

app.notFound((c) => c.json(errorBody("ROUTE_NOT_FOUND", "common.routeNotFound"), 404));
