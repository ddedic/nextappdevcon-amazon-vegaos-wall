import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

import { CONFIG_FILE } from "./paths.mjs";

/** The current boothwall.config.ts (Node strips its types). Fresh on every call. */
export async function readConfig() {
  const url = `${pathToFileURL(CONFIG_FILE).href}?t=${Date.now()}`;
  return (await import(url)).boothwallConfig;
}

const quote = (value) => JSON.stringify(value);

/**
 * Edits values in boothwall.config.ts in place, keeping its comments and layout.
 * `updates` is a list of [path, value], where path is "demo" or "section.key".
 */
export function updateConfig(updates) {
  let source = readFileSync(CONFIG_FILE, "utf8");
  for (const [path, value] of updates) {
    const [section, key] = path.includes(".") ? path.split(".") : [undefined, path];
    const literal = typeof value === "string" ? quote(value) : String(value);
    if (!section) {
      source = replaceOnce(source, new RegExp(`(\\n  ${key}: )[^,\\n]+,`), `$1${literal},`, path);
      continue;
    }
    const start = source.indexOf(`\n  ${section}: {`);
    const end = source.indexOf("\n  },", start);
    if (start === -1 || end === -1)
      throw new Error(`Can't find "${section}" in boothwall.config.ts`);
    const block = replaceOnce(
      source.slice(start, end),
      new RegExp(`(\\n    ${key}: )[^,\\n]+,`),
      `$1${literal},`,
      path,
    );
    source = source.slice(0, start) + block + source.slice(end);
  }
  writeFileSync(CONFIG_FILE, source);
}

function replaceOnce(text, pattern, replacement, path) {
  if (!pattern.test(text)) throw new Error(`Can't find "${path}" in boothwall.config.ts`);
  return text.replace(pattern, replacement);
}
