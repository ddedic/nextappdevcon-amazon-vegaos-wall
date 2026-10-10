import type { PhotoDTO } from "@boothwall/shared";
import { useCallback, useMemo, useState } from "react";

/** Multi-select for bulk actions; ids no longer in the list drop out on their own. */
export function usePhotoSelection(photos: PhotoDTO[]) {
  const [active, setActive] = useState(false);
  const [ids, setIds] = useState<ReadonlySet<string>>(new Set());

  const selected = useMemo(() => photos.filter((photo) => ids.has(photo.id)), [ids, photos]);

  const toggle = useCallback((id: string) => {
    setIds((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => setIds(new Set(photos.map((photo) => photo.id))), [photos]);

  const start = useCallback(() => setActive(true), []);

  const stop = useCallback(() => {
    setActive(false);
    setIds(new Set());
  }, []);

  return {
    active,
    selected,
    isSelected: (id: string) => ids.has(id),
    toggle,
    selectAll,
    start,
    stop,
  };
}
