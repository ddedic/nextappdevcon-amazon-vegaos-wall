import { Image } from "react-native";

/** Recently requested URLs, so the same photo isn't fetched twice in a row. Bounded. */
const recent: string[] = [];
const RECENT_LIMIT = 16;

/** Warms the image cache for a photo the wall is about to show large. Best effort, never throws. */
export function prefetchImage(url: string | null | undefined) {
  if (!url || !/^https?:/.test(url) || recent.includes(url)) return;
  if (typeof Image.prefetch !== "function") return;
  recent.push(url);
  if (recent.length > RECENT_LIMIT) recent.shift();
  // Let a later call try again; the card itself retries and falls back to a placeholder.
  const forget = () => {
    const index = recent.indexOf(url);
    if (index !== -1) recent.splice(index, 1);
  };
  try {
    Image.prefetch(url).catch(forget);
  } catch {
    forget();
  }
}
