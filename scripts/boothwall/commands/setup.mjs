import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

import { cf, databaseInAccount, ensureLoggedIn, parseJson } from "../lib/cf.mjs";
import { readConfig, updateConfig } from "../lib/config-file.mjs";
import { DEV_VARS } from "../lib/paths.mjs";
import { ask, askHidden, bold, dim, log, ok, step, UserError } from "../lib/ui.mjs";
import { deployApi, deployWeb } from "./deploy.mjs";
import { migrate } from "./migrate.mjs";

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const MIN_PASSCODE = 12;

/**
 * One-time setup on your own Cloudflare account: creates the D1 database and R2 bucket,
 * sets the booth passcode, applies migrations, deploys both Workers and writes the
 * resulting ids and URLs back into boothwall.config.ts. Safe to run again: it reuses
 * whatever already exists.
 */
export async function setup() {
  step("Checking your Cloudflare login");
  const whoami = await ensureLoggedIn();
  ok(`Logged in${whoami.email ? ` as ${whoami.email}` : ""}`);

  const deploy = await claimConfig(await readConfig());
  log(dim(`  Resources are named after deploy.name "${deploy.name}" in boothwall.config.ts.`));

  const databaseId = await ensureDatabase(deploy.name, deploy.d1DatabaseId);
  updateConfig([["deploy.d1DatabaseId", databaseId]]);
  await ensureBucket(`${deploy.name}-photos`);
  const passcode = await ensurePasscode();

  await migrate();
  const apiUrl = (await deployApi({ withSecrets: true })) ?? (await askUrl("API"));
  updateConfig([["urls.api", apiUrl]]);

  const webUrl = (await deployWeb()) ?? (await askUrl("web app"));
  updateConfig([
    ["urls.web", webUrl],
    ["demo", false],
  ]);
  // Both again, now that the URLs are final: the API needs the web app's origin (CORS), and the
  // web wall bakes in demo mode and the QR code's URL at build time.
  await deployApi();
  await deployWeb();

  log();
  log(bold("BoothWall is live."));
  log(`  Wall          ${webUrl}`);
  log(`  Upload page   ${webUrl}/snap  ${dim("(the TV's QR code)")}`);
  log(`  Control panel ${webUrl}/control`);
  if (passcode)
    log(`  Passcode      ${passcode}  ${dim("(saved in apps/api/.dev.vars, gitignored)")}`);
  log();
  log("Next: build the TV app and install it on your Fire TV or the Vega Virtual Device:");
  log(dim("  pnpm tv:build:release"));
  log(
    dim(
      "  vega run-app apps/tv/build/armv7-release/tv_armv7.vpkg com.boothwall.app.main -d <device>",
    ),
  );
  log(dim("Commit boothwall.config.ts so the TV build and future deploys use these values."));
}

/**
 * A fresh clone's config still points at the public demo's database and domains. Drop the
 * database id so setup creates one in this account, and stop if the domains are still set:
 * they're on a zone this account doesn't have.
 */
async function claimConfig({ deploy }) {
  if (!deploy.d1DatabaseId || (await databaseInAccount(deploy.d1DatabaseId))) return deploy;
  const domains = [deploy.apiDomain, deploy.webDomain].filter(Boolean);
  if (domains.length) {
    throw new UserError(
      `boothwall.config.ts still has the public demo's domains (${domains.join(", ")}).\n` +
        "  Set deploy.apiDomain and deploy.webDomain to domains on your Cloudflare account,\n" +
        '  or to "" for free workers.dev addresses, then run setup again.',
    );
  }
  log(dim("  The config pointed at another account's database; creating one in yours."));
  updateConfig([["deploy.d1DatabaseId", ""]]);
  return { ...deploy, d1DatabaseId: "" };
}

async function ensureDatabase(name, existingId) {
  step(`D1 database "${name}"`);
  if (existingId) {
    ok(`Using ${existingId}`);
    return existingId;
  }
  const listed = parseJson(await cf(["d1", "list", "--name", name]));
  const rows = Array.isArray(listed) ? listed : (listed?.result ?? []);
  const found = rows.find((row) => row?.name === name);
  if (found) {
    const id = found.uuid ?? found.id;
    ok(`Found existing database ${id}`);
    return id;
  }
  const id = (await cf(["d1", "create", "--name", name])).match(UUID)?.[0];
  if (!id) throw new UserError("Created the database but couldn't read its id. Run setup again.");
  ok(`Created ${id}`);
  return id;
}

async function ensureBucket(name) {
  step(`R2 bucket "${name}"`);
  if ((await cf(["r2", "buckets", "list"])).includes(`"${name}"`)) {
    ok("Already exists");
    return;
  }
  await cf(["r2", "buckets", "create", "--name", name]);
  ok("Created");
}

/** Keeps an existing passcode; otherwise asks for one or generates a strong one. */
async function ensurePasscode() {
  step("Control panel passcode");
  const current = existsSync(DEV_VARS)
    ? readFileSync(DEV_VARS, "utf8").match(/^ADMIN_TOKEN=(.+)$/m)?.[1]
    : "";
  if (current) {
    ok("Using the passcode in apps/api/.dev.vars");
    return undefined;
  }
  let passcode = await askHidden(
    `  Choose a passcode (${MIN_PASSCODE}+ characters, Enter to generate one): `,
  );
  if (passcode && passcode.length < MIN_PASSCODE) {
    throw new UserError(
      `Use at least ${MIN_PASSCODE} characters, or press Enter for a generated one.`,
    );
  }
  const generated = !passcode;
  passcode ||= randomBytes(18).toString("base64url");
  writeFileSync(DEV_VARS, `ADMIN_TOKEN=${passcode}\n`, { mode: 0o600 });
  ok("Saved to apps/api/.dev.vars");
  return generated ? passcode : undefined;
}

async function askUrl(what) {
  const url = await ask(`  Couldn't read the ${what} URL from the deploy output. Paste it here: `);
  if (!/^https:\/\//.test(url))
    throw new UserError(`That doesn't look like a URL: ${url || "(empty)"}`);
  return url.replace(/\/$/, "");
}
