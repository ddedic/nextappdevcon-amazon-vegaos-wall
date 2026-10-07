import { describe, expect, it } from "vitest";

import { isHotlinked } from "./hotlink";

const allowed = ["https://nextapp-wall.dedic.dev"];
const self = "https://nextapp-wall-api.dedic.dev";

describe("isHotlinked", () => {
  it("lets our pages and non-browser clients through", () => {
    expect(isHotlinked({ referer: "https://nextapp-wall.dedic.dev/admin" }, allowed, self)).toBe(
      false,
    );
    expect(isHotlinked({ secFetchSite: "same-site" }, allowed, self)).toBe(false);
    expect(isHotlinked({}, allowed, self)).toBe(false);
  });

  it("blocks other sites, even when they hide the referer", () => {
    expect(isHotlinked({ referer: "https://evil.example/page" }, allowed, self)).toBe(true);
    expect(isHotlinked({ secFetchSite: "cross-site" }, allowed, self)).toBe(true);
  });
});
