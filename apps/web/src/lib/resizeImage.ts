import { PHOTO_LIMITS } from "@boothwall/shared";

export type ResizedImage = { image: Blob; thumb: Blob };

/** Draws the bitmap with its longest edge at most `maxEdgePx` and encodes it as JPEG. */
function encodeJpeg(bitmap: ImageBitmap, maxEdgePx: number, quality: number): Promise<Blob> {
  const scale = Math.min(1, maxEdgePx / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode the photo."))),
      "image/jpeg",
      quality,
    ),
  );
}

/**
 * ~1080px JPEG before upload, EXIF orientation applied, plus a 480px copy the wall
 * cards decode instead of the full image.
 */
export async function resizeImage(file: File): Promise<ResizedImage> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const image = await encodeJpeg(bitmap, PHOTO_LIMITS.maxEdgePx, 0.85);
    const thumb = await encodeJpeg(bitmap, PHOTO_LIMITS.thumbEdgePx, 0.8);
    return { image, thumb };
  } finally {
    bitmap.close();
  }
}
