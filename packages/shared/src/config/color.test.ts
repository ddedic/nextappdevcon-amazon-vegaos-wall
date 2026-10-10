import { describe, expect, it } from "vitest";

import { contrast, readableOn, textOn, withAlpha } from "./color";

describe("brand colour helpers", () => {
  it("picks readable text on light and dark fills", () => {
    expect(textOn("#F255E3")).toBe("#000000");
    expect(textOn("#1B1B6B")).toBe("#FFFFFF");
    expect(contrast("#000000", "#FFFFFF")).toBeCloseTo(21, 0);
  });

  it("keeps a readable brand colour and shades a faint one just enough", () => {
    expect(readableOn("#F255E3", "#000000")).toBe("#F255E3");
    for (const [color, background] of [
      ["#1A1A2E", "#000000"],
      ["#FF9F1C", "#FBFAF7"],
    ] as const) {
      const shaded = readableOn(color, background);
      expect(shaded).not.toBe(color);
      expect(contrast(shaded, background)).toBeGreaterThanOrEqual(3);
      expect(["#000000", "#FFFFFF"]).not.toContain(shaded);
    }
  });

  it("builds rgba tints", () => {
    expect(withAlpha("#F255E3", 0.5)).toBe("rgba(242, 85, 227, 0.5)");
  });
});
