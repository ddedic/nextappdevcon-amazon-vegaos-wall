import type { PhotoDTO } from "@boothwall/shared";
import React, { memo, useMemo } from "react";

import { type PlacedPhoto, SLOTS } from "../../constants/layout";
import type { WallState } from "../../state/wallState";
import { EmptyWall } from "./EmptyWall";
import { FloatingSlot } from "./FloatingSlot";
import { SelectedPhoto } from "./SelectedPhoto";

export type WallCollageProps = {
  wall: WallState;
  selectedSlot: number;
  /** The lifted selection, or null while the spotlight is open. */
  selection: PlacedPhoto | null;
  onSettled: (photoId: string) => void;
};

export const WallCollage = memo(function WallCollage({
  wall,
  selectedSlot,
  selection,
  onSettled,
}: WallCollageProps) {
  const photos = useMemo(
    () => new Map<string, PhotoDTO>(wall.pool.map((photo) => [photo.id, photo])),
    [wall.pool],
  );
  const isEmpty = wall.slots.every((id) => id === null);

  return (
    <>
      {SLOTS.map((slot, index) => {
        const id = wall.slots[index] ?? null;
        return (
          <FloatingSlot
            key={index}
            photo={id ? (photos.get(id) ?? null) : null}
            slot={slot}
            index={index}
            isFresh={id !== null && wall.fresh.includes(id)}
            lifted={selection !== null && index === selectedSlot}
            onSettled={onSettled}
          />
        );
      })}

      <SelectedPhoto selection={selection} />

      {isEmpty && <EmptyWall />}
    </>
  );
});
