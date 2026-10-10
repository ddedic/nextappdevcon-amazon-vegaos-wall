import { cpSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { EXAMPLES_DIR, ROOT } from "../lib/paths.mjs";
import { confirm, dim, log, ok, step, UserError } from "../lib/ui.mjs";

const available = () =>
  readdirSync(EXAMPLES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

/** Copies an example's config and brand files over the repo (they mirror its layout). */
export async function applyExample(name, { yes = false } = {}) {
  if (!name) {
    log(`Examples: ${available().join(", ")}`);
    log(dim("Apply one with `pnpm boothwall example <name>`."));
    return;
  }
  const dir = join(EXAMPLES_DIR, name);
  if (!existsSync(dir))
    throw new UserError(`No example "${name}". Available: ${available().join(", ")}`);

  step(`Applying example "${name}"`);
  log(dim("  This overwrites boothwall.config.ts and the brand images with the example's."));
  if (!yes && !(await confirm("  Continue?"))) throw new UserError("Nothing changed.");
  for (const folder of ["apps", "packages"]) {
    if (existsSync(join(dir, folder)))
      cpSync(join(dir, folder), join(ROOT, folder), { recursive: true });
  }
  ok("Done. `git diff` shows what changed; `git checkout -- apps packages` undoes it.");
}
