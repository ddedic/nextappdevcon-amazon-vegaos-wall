import { z } from "zod";

import type { AppBindings } from "@/core/runtime/bindings";

const configSchema = z.object({
  ADMIN_TOKEN: z.string().min(6, "ADMIN_TOKEN must be at least 6 characters"),
  ALLOWED_ORIGINS: z.string().transform((value) =>
    value
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  ),
  RETENTION_DAYS: z.coerce.number().int().positive(),
});

export type AppConfig = z.infer<typeof configSchema>;

let cached: AppConfig | undefined;

export function readConfig(env: AppBindings): AppConfig {
  cached ??= configSchema.parse(env);
  return cached;
}
