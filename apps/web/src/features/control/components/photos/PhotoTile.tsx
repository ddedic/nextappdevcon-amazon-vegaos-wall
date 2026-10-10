import { type PhotoDTO, TRIBES } from "@boothwall/shared";
import { Check } from "lucide-react";

import { StatusBadge } from "@/features/control/components/photos/StatusBadge";
import { controlCopy } from "@/features/control/constants/copy";
import { cn } from "@/lib/cn";

export type PhotoTileProps = {
  photo: PhotoDTO;
  selecting: boolean;
  selected: boolean;
  busy: boolean;
  onOpen: () => void;
  onToggle: () => void;
};

/** One photo in the grid: opens the photo sheet, or toggles selection in select mode. */
export function PhotoTile({ photo, selecting, selected, busy, onOpen, onToggle }: PhotoTileProps) {
  const caption = photo.caption ?? controlCopy.noCaption;
  return (
    <li className="animate-rise-in">
      <button
        type="button"
        onClick={selecting ? onToggle : onOpen}
        aria-pressed={selecting ? selected : undefined}
        aria-label={
          selecting
            ? controlCopy.photos.selectPhoto(caption)
            : controlCopy.photos.openPhoto(caption)
        }
        className={cn(
          "group block w-full overflow-hidden rounded-card border bg-surface text-left transition active:scale-[0.97]",
          selected ? "border-ink ring-2 ring-ink" : "border-line hover:border-ink-subtle",
          busy && "opacity-60",
        )}
      >
        <span className="relative block">
          <img
            src={photo.thumbUrl}
            alt=""
            loading="lazy"
            className={cn(
              "aspect-square w-full object-cover transition",
              photo.status === "hidden" && "opacity-50 grayscale",
              selected && "scale-[0.92] rounded-control",
            )}
          />
          <StatusBadge status={photo.status} className="absolute top-2 left-2" />
          {selecting && (
            <span
              aria-hidden
              className={cn(
                "absolute top-2 right-2 flex size-7 items-center justify-center rounded-pill border-2 transition",
                selected ? "border-ink bg-ink text-ink-inverse" : "border-ink bg-canvas/40",
              )}
            >
              {selected && <Check className="size-4" strokeWidth={3} />}
            </span>
          )}
        </span>
        <span className="block px-3 py-2">
          <span className="block truncate text-sm font-medium">{caption}</span>
          <span className="block truncate text-xs text-ink-subtle">{TRIBES[photo.tribe]}</span>
        </span>
      </button>
    </li>
  );
}
