import { describe, expect, it } from "vitest";

import { boothwallConfig } from "./boothwall.config";
import { boothwallConfigSchema } from "./boothwall.schema";

describe("boothwall config", () => {
  it("accepts the shipped config", () => {
    expect(boothwallConfigSchema.safeParse(boothwallConfig).success).toBe(true);
  });

  it("rejects duplicate category ids, two catch-alls and a bad hashtag", () => {
    const broken = {
      ...boothwallConfig,
      event: { ...boothwallConfig.event, hashtag: "no hash" },
      categories: [
        { id: "a", label: "A", catchAll: true },
        { id: "a", label: "A again", catchAll: true },
      ],
    };
    const result = boothwallConfigSchema.safeParse(broken);
    expect(result.success).toBe(false);
    const messages = result.error?.issues.map((issue) => issue.message) ?? [];
    expect(messages).toEqual(
      expect.arrayContaining([
        "hashtag must look like #yourevent",
        "category ids must be unique",
        "only one catch-all category",
      ]),
    );
  });
});
