import { CONTROL_PATH, SNAP_PATH } from "@/lib/links";

export type Screen = "wall" | "snap" | "control";

export type Route = {
  screen: Screen;
  /** Set when the address is an old one; the app swaps it in without a reload. */
  redirectTo?: string;
};

/**
 * Old addresses and where they live now: /admin was the Control panel and /wall the wall.
 * The deployed site redirects these on the server (_redirects); this covers `pnpm web:dev`.
 */
const LEGACY_PATHS: [RegExp, string][] = [
  [/^\/admin(\/|$)/, CONTROL_PATH],
  [/^\/wall(\/|$)/, "/"],
];

/**
 * Three screens only, so a pathname switch beats pulling in a router. Case-insensitive: the TV's
 * QR codes are upper case (smaller, easier to scan), so phones arrive at /SNAP.
 */
export function resolveRoute(pathname: string): Route {
  const lower = pathname.toLowerCase();
  const legacy = LEGACY_PATHS.find(([pattern]) => pattern.test(lower));
  const path = legacy?.[1] ?? lower;
  const screen: Screen = path.startsWith(CONTROL_PATH)
    ? "control"
    : path.startsWith(SNAP_PATH)
      ? "snap"
      : "wall";
  return path === pathname ? { screen } : { screen, redirectTo: path };
}
