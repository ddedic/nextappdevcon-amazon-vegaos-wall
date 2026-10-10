#!/usr/bin/env node
// BoothWall CLI: `pnpm boothwall <command>`. Set up and deploy your own wall on Cloudflare.
import { deployAll } from "./commands/deploy.mjs";
import { applyExample } from "./commands/example.mjs";
import { migrate } from "./commands/migrate.mjs";
import { setup } from "./commands/setup.mjs";
import { bold, dim, log, UserError } from "./lib/ui.mjs";

const HELP = `${bold("BoothWall")}: an open-source Amazon Vega OS sample, a live photo wall for event booths.

${bold("Usage")}  pnpm boothwall <command>

  setup            Create the Cloudflare resources, deploy the API and web app,
                   and write the ids and URLs into boothwall.config.ts. Run once.
  deploy           Apply migrations and redeploy the API and web app.
  migrate          Apply database migrations (${dim("--local")} for local dev).
  example [name]   List examples, or apply one's config and brand files.

Edit packages/shared/src/config/boothwall.config.ts to make the wall yours.
Docs: docs/customising.md`;

const [command, ...rest] = process.argv.slice(2);
const flags = new Set(rest.filter((arg) => arg.startsWith("--")));
const [arg] = rest.filter((value) => !value.startsWith("--"));

const commands = {
  setup: () => setup(),
  deploy: () => deployAll(),
  migrate: () => migrate({ local: flags.has("--local") }),
  example: () => applyExample(arg, { yes: flags.has("--yes") }),
};

try {
  const run = commands[command];
  if (!run) {
    log(HELP);
    process.exitCode = command && !["help", "--help", "-h"].includes(command) ? 1 : 0;
  } else {
    await run();
  }
} catch (error) {
  if (!(error instanceof UserError)) throw error;
  console.error(`\n${error.message}`);
  process.exitCode = 1;
}
