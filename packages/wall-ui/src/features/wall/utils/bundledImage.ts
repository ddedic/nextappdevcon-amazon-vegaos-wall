import { Image, type ImageSourcePropType } from "react-native";

/** An image imported from src/assets. Metro hands over an asset id; Vite a URL (see .web.ts). */
export type BundledImage = ImageSourcePropType;

export const imageSource = (image: BundledImage): ImageSourcePropType => image;

export const imageUri = (image: BundledImage): string => Image.resolveAssetSource(image).uri;

/** Width over height, known up front on Vega because Metro records every image's size. */
export function useImageAspect(image: BundledImage): number | null {
  const { width, height } = Image.resolveAssetSource(image);
  return width / height;
}
