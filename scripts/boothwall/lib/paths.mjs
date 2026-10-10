import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Absolute paths the CLI works with, independent of where it's run from. */
export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
export const CONFIG_FILE = join(ROOT, "packages/shared/src/config/boothwall.config.ts");
export const API_DIR = join(ROOT, "apps/api");
export const WEB_DIR = join(ROOT, "apps/web");
export const EXAMPLES_DIR = join(ROOT, "examples");
export const DEV_VARS = join(API_DIR, ".dev.vars");
export const CF = join(ROOT, "node_modules/.bin/cf");
