import { describe, expect, it } from "vitest";

import { resolveRoute } from "./routes";

describe("resolveRoute", () => {
  it.each([
    ["/", "wall"],
    ["/snap", "snap"],
    ["/control", "control"],
    ["/anything-else", "wall"],
  ])("serves %s as the %s screen", (pathname, screen) => {
    expect(resolveRoute(pathname)).toEqual({ screen });
  });

  it.each([
    ["/admin", "control", "/control"],
    ["/admin/queue", "control", "/control"],
    ["/wall", "wall", "/"],
    ["/SNAP", "snap", "/snap"],
    ["/ADMIN", "control", "/control"],
  ])("moves %s to its canonical address", (pathname, screen, redirectTo) => {
    expect(resolveRoute(pathname)).toEqual({ screen, redirectTo });
  });
});
