import { useEffect, useState } from "react";
import { Image, type ImageSourcePropType } from "react-native";

/** Vite imports an image as its URL. */
export type BundledImage = string;

export const imageSource = (image: BundledImage): ImageSourcePropType => ({ uri: image });

export const imageUri = (image: BundledImage): string => image;

/** Vite doesn't know image sizes, so the aspect is read once the browser has loaded it. */
export function useImageAspect(image: BundledImage): number | null {
  const [aspect, setAspect] = useState<number | null>(null);
  useEffect(() => {
    let live = true;
    Image.getSize(image, (width, height) => {
      if (live) setAspect(width / height);
    });
    return () => {
      live = false;
    };
  }, [image]);
  return aspect;
}
