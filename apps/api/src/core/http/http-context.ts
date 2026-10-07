import type { AppConfig } from "@/config/env";
import type { AppBindings } from "@/core/runtime/bindings";

export type AppVariables = {
  requestId: string;
  config: AppConfig;
};

export type AppEnv = { Bindings: AppBindings; Variables: AppVariables };
