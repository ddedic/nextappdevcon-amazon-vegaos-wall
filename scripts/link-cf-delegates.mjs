// The cf CLI (beta) only looks for @cloudflare/vite-plugin in the app's own
// node_modules, but our hoisted install puts it at the repo root. Link it in.
import { existsSync, mkdirSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { dirname, join, relative } from "node:path";

const root = join(dirname(new URL(import.meta.url).pathname), "..");
const pkg = "@cloudflare/vite-plugin";
const source = join(root, "node_modules", pkg);

for (const app of ["apps/api", "apps/web"]) {
  const manifest = join(root, app, "package.json");
  if (!existsSync(manifest) || !existsSync(source)) continue;
  const { dependencies = {}, devDependencies = {} } = JSON.parse(readFileSync(manifest, "utf8"));
  if (!(pkg in dependencies) && !(pkg in devDependencies)) continue;

  const target = join(root, app, "node_modules", pkg);
  mkdirSync(dirname(target), { recursive: true });
  rmSync(target, { recursive: true, force: true });
  symlinkSync(relative(dirname(target), source), target);
}
