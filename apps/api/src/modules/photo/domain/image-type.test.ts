/// <reference types="node" />
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { readImageSize, sniffImageType } from "./image-type";

const image = (name: string) =>
  new Uint8Array(
    readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../../../../../docs/images", name),
    ),
  );

describe("image header checks", () => {
  it("reads type and pixel size from real files", () => {
    const jpg = image("tv-wall.jpg");
    const png = image("social-preview.png");
    expect(sniffImageType(jpg)).toBe("image/jpeg");
    expect(readImageSize(jpg, "image/jpeg")).toEqual({ width: 1600, height: 891 });
    expect(sniffImageType(png)).toBe("image/png");
    expect(readImageSize(png, "image/png")).toEqual({ width: 1280, height: 640 });
  });
});
