/** The image type from the file's first bytes; the browser-declared type is never trusted. */
export function sniffImageType(
  bytes: Uint8Array,
): "image/jpeg" | "image/png" | "image/webp" | undefined {
  const at = (offset: number, sig: number[]) => sig.every((b, i) => bytes[offset + i] === b);
  if (at(0, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (at(0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (at(0, [0x52, 0x49, 0x46, 0x46]) && at(8, [0x57, 0x45, 0x42, 0x50])) return "image/webp";
  return undefined;
}

const SOF_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);

/** Pixel size from the image header, without decoding it. Undefined when it can't be read. */
export function readImageSize(
  bytes: Uint8Array,
  type: "image/jpeg" | "image/png" | "image/webp",
): { width: number; height: number } | undefined {
  const u16be = (i: number) => ((bytes[i] ?? 0) << 8) | (bytes[i + 1] ?? 0);
  const u16le = (i: number) => (bytes[i] ?? 0) | ((bytes[i + 1] ?? 0) << 8);
  const u24le = (i: number) => u16le(i) | ((bytes[i + 2] ?? 0) << 16);
  const u32be = (i: number) => u16be(i) * 0x10000 + u16be(i + 2);
  const ascii = (i: number, text: string) =>
    [...text].every((ch, k) => bytes[i + k] === ch.charCodeAt(0));

  if (type === "image/png") {
    return bytes.length >= 24 ? { width: u32be(16), height: u32be(20) } : undefined;
  }
  if (type === "image/webp") {
    if (ascii(12, "VP8 ")) return { width: u16le(26) & 0x3fff, height: u16le(28) & 0x3fff };
    if (ascii(12, "VP8L")) {
      const [b0 = 0, b1 = 0, b2 = 0, b3 = 0] = bytes.subarray(21, 25);
      return {
        width: 1 + (((b1 & 0x3f) << 8) | b0),
        height: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)),
      };
    }
    if (ascii(12, "VP8X")) return { width: 1 + u24le(24), height: 1 + u24le(27) };
    return undefined;
  }
  // JPEG: walk the segments to the frame header.
  let i = 2;
  while (i + 9 < bytes.length) {
    if (bytes[i] !== 0xff) return undefined;
    const marker = bytes[i + 1] ?? 0;
    if (marker === 0xff) {
      i += 1;
      continue;
    }
    if (SOF_MARKERS.has(marker)) return { width: u16be(i + 7), height: u16be(i + 5) };
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2;
      continue;
    }
    i += 2 + u16be(i + 2);
  }
  return undefined;
}
