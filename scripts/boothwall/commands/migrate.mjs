import { cf } from "../lib/cf.mjs";
import { readConfig } from "../lib/config-file.mjs";
import { API_DIR } from "../lib/paths.mjs";
import { ok, step, UserError } from "../lib/ui.mjs";

// The D1 id `cf dev` uses until setup writes the real one. Matches apps/api/cloudflare.config.ts.
const LOCAL_D1_ID = "00000000-0000-4000-8000-000000000000";
// Where `cf dev` keeps local D1, R2 and Durable Object data (relative to apps/api).
const LOCAL_STATE = ".cloudflare/state";

/** Applies the D1 migrations in apps/api/migrations, to Cloudflare or (`--local`) to dev. */
export async function migrate({ local = false } = {}) {
  const { deploy } = await readConfig();
  if (!deploy.d1DatabaseId && !local) {
    throw new UserError("No D1 database yet. Run `pnpm boothwall setup` first.");
  }
  step(local ? "Applying migrations locally" : "Applying database migrations");
  const id = deploy.d1DatabaseId || LOCAL_D1_ID;
  const args = ["d1", "migrations", "apply", id, "--dir", "migrations"];
  await cf(local ? [...args, "--local", "--persist-to", LOCAL_STATE] : args, { cwd: API_DIR });
  ok("Database is up to date");
}
