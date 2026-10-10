import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

import { CF, ROOT } from "./paths.mjs";
import { UserError } from "./ui.mjs";

/**
 * Runs the Cloudflare `cf` CLI and resolves with its output. `stream` also shows the output
 * live, for long steps like deploys.
 */
export function cf(args, { cwd = ROOT, stream = false } = {}) {
  if (!existsSync(CF)) throw new UserError("The cf CLI isn't installed. Run `pnpm install` first.");
  return new Promise((resolve, reject) => {
    const child = spawn(CF, args, { cwd, stdio: ["inherit", "pipe", "pipe"] });
    let output = "";
    const collect = (target) => (chunk) => {
      output += chunk;
      if (stream) target.write(chunk);
    };
    child.stdout.on("data", collect(process.stdout));
    child.stderr.on("data", collect(process.stderr));
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0
        ? resolve(output)
        : reject(new UserError(`cf ${args.join(" ")} failed:\n${output.trim().slice(-1500)}`)),
    );
  });
}

/** Parses the first JSON value in cf's output (it can print log lines around it). */
export function parseJson(output) {
  const start = output.search(/[[{]/);
  if (start === -1) return undefined;
  try {
    return JSON.parse(output.slice(start));
  } catch {
    return undefined;
  }
}

export async function ensureLoggedIn() {
  const whoami = parseJson(await cf(["auth", "whoami"]).catch(() => ""));
  if (!whoami?.authenticated) {
    throw new UserError(
      "You're not logged in to Cloudflare. Run `pnpm exec cf auth login`, then try again.",
    );
  }
  return whoami;
}

/** The public URL a deploy printed: the workers.dev address, or the custom domain we set. */
export function deployedUrl(output, customDomain) {
  if (customDomain) return `https://${customDomain}`;
  return output.match(/https:\/\/[a-z0-9.-]+\.workers\.dev/i)?.[0];
}

/**
 * Whether a D1 database id belongs to the logged-in account. A fresh clone's config points at
 * the public demo's resources, which nobody else can use.
 */
export async function databaseInAccount(id) {
  const listed = parseJson(await cf(["d1", "list"]));
  const rows = Array.isArray(listed) ? listed : (listed?.result ?? []);
  return rows.some((row) => (row?.uuid ?? row?.id) === id);
}
