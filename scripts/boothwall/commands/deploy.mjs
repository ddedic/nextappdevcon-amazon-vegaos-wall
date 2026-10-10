import { cf, databaseInAccount, deployedUrl, ensureLoggedIn } from "../lib/cf.mjs";
import { readConfig } from "../lib/config-file.mjs";
import { API_DIR, WEB_DIR } from "../lib/paths.mjs";
import { ok, step, UserError } from "../lib/ui.mjs";
import { migrate } from "./migrate.mjs";

/** Deploys the API Worker. Returns its public URL, if the output had one. */
export async function deployApi({ withSecrets = false } = {}) {
  const { deploy } = await readConfig();
  step(`Deploying the API (${deploy.name}-api)`);
  const args = withSecrets ? ["deploy", "--secrets-file", ".dev.vars"] : ["deploy"];
  const output = await cf(args, { cwd: API_DIR, stream: true });
  const url = deployedUrl(output, deploy.apiDomain);
  ok(`API is live${url ? ` at ${url}` : ""}`);
  return url;
}

/** Builds and deploys the web app Worker. Returns its public URL, if known. */
export async function deployWeb() {
  const { deploy } = await readConfig();
  step(`Deploying the web app (${deploy.name})`);
  const output = await cf(["deploy"], { cwd: WEB_DIR, stream: true });
  const url = deployedUrl(output, deploy.webDomain);
  ok(`Web app is live${url ? ` at ${url}` : ""}`);
  return url;
}

/** Redeploys everything after a change: migrations, the API, then the web app. */
export async function deployAll() {
  await ensureLoggedIn();
  const { deploy } = await readConfig();
  if (!deploy.d1DatabaseId || !(await databaseInAccount(deploy.d1DatabaseId)))
    throw new UserError("Nothing to deploy yet in this account. Run `pnpm boothwall setup` first.");
  await migrate();
  await deployApi();
  await deployWeb();
}
