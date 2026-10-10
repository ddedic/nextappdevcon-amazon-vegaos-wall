import { CATCH_ALL_TRIBE, type PhotoDTO, TRIBES } from "@boothwall/shared";

import { wallCopy } from "@/features/wall/constants/copy";
import { cn } from "@/lib/cn";

interface PhotoFeedProps {
  photos: PhotoDTO[];
}

// A slight alternating tilt, like the polaroids on the TV.
const TILTS = ["-rotate-1", "rotate-1", "rotate-[0.5deg]", "-rotate-[0.5deg]"];

/** Newest first, two polaroids a row. */
export function PhotoFeed({ photos }: PhotoFeedProps) {
  if (photos.length === 0)
    return (
      <p className="rounded-card border border-dashed border-line p-6 text-center text-sm text-ink-muted">
        {wallCopy.phone.empty}
      </p>
    );

  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-4">
      {photos.map((photo, index) => (
        <li key={photo.id} className={cn("motion-safe:transition", TILTS[index % TILTS.length])}>
          <figure className="rounded-paper bg-paper p-2 pb-2.5 shadow-paper">
            <img
              src={photo.thumbUrl}
              alt={photo.caption ?? ""}
              loading="lazy"
              className="aspect-square w-full rounded-photo bg-line object-cover"
            />
            <figcaption className="mt-2 min-h-5 px-0.5 text-paper-ink">
              <span className="line-clamp-2 text-sm leading-snug font-medium">{photo.caption}</span>
              {photo.tribe !== CATCH_ALL_TRIBE && (
                <span className="block truncate text-2xs font-bold tracking-wider text-secondary uppercase">
                  {TRIBES[photo.tribe]}
                </span>
              )}
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
