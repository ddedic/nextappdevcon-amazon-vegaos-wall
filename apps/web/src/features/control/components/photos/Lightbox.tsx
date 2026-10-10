import type { PhotoDTO } from "@boothwall/shared";
import { X } from "lucide-react";

import { Dialog } from "@/components/ui/Dialog";
import { controlCopy } from "@/features/control/constants/copy";

export type LightboxProps = {
  photo: PhotoDTO | null;
  onClose: () => void;
};

/** The full image, edge to edge; tap anywhere or press Escape to close. */
export function Lightbox({ photo, onClose }: LightboxProps) {
  return (
    <Dialog
      open={photo !== null}
      onClose={onClose}
      variant="full"
      label={controlCopy.sheet.openLarge}
    >
      {photo && (
        <button
          type="button"
          onClick={onClose}
          aria-label={controlCopy.sheet.close}
          className="flex size-full items-center justify-center p-4"
        >
          <img
            src={photo.imageUrl}
            alt={photo.caption ?? controlCopy.photoAlt}
            className="max-h-full max-w-full rounded-control object-contain"
          />
          <span className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 flex size-11 items-center justify-center rounded-pill border border-line bg-canvas/70 text-ink">
            <X aria-hidden className="size-5" strokeWidth={2} />
          </span>
        </button>
      )}
    </Dialog>
  );
}
