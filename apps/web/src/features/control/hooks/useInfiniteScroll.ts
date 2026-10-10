import { useEffect, useRef } from "react";

/** Calls `onReach` when the returned sentinel scrolls near the viewport. */
export function useInfiniteScroll<T extends Element>(onReach: () => void, enabled: boolean) {
  const ref = useRef<T>(null);
  const latest = useRef(onReach);
  latest.current = onReach;

  useEffect(() => {
    const node = ref.current;
    if (!node || !enabled || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) latest.current();
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled]);

  return ref;
}
