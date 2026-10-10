import { type PhotoDTO, TRIBES } from "@boothwall/shared";
import { Check, Eye, EyeOff, Maximize2, Trash2, X } from "lucide-react";
import { useId } from "react";

import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { PhotoEditForm } from "@/features/control/components/photos/PhotoEditForm";
import { StatusBadge } from "@/features/control/components/photos/StatusBadge";
import { controlCopy } from "@/features/control/constants/copy";
import type { PhotoEdit } from "@/features/control/hooks/usePhotoLibrary";
import { formatTime } from "@/lib/formatTime";

export type PhotoSheetProps = {
  photo: PhotoDTO | null;
  busy: boolean;
  onClose: () => void;
  onOpenLarge: () => void;
  onSave: (edit: PhotoEdit) => Promise<boolean>;
  onApprove: () => void;
  onSetHidden: (hidden: boolean) => void;
  onDelete: () => void;
};

const copy = controlCopy.sheet;

/** Everything for one photo: a large preview, the edit form and its actions. */
export function PhotoSheet({
  photo,
  busy,
  onClose,
  onOpenLarge,
  onSave,
  onApprove,
  onSetHidden,
  onDelete,
}: PhotoSheetProps) {
  const titleId = useId();
  return (
    <Dialog open={photo !== null} onClose={onClose} labelledBy={titleId}>
      {photo && (
        <div className="flex flex-col gap-5 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-3">
            <h2 id={titleId} className="text-lg font-semibold">
              {copy.title}
            </h2>
            <StatusBadge status={photo.status} />
            <span className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              aria-label={copy.close}
              className="flex size-10 items-center justify-center rounded-pill text-ink-muted transition hover:bg-surface-strong hover:text-ink active:scale-90"
            >
              <X aria-hidden className="size-5" strokeWidth={2} />
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenLarge}
            aria-label={copy.openLarge}
            className="group relative overflow-hidden rounded-card border border-line"
          >
            <img
              src={photo.imageUrl}
              alt={photo.caption ?? controlCopy.photoAlt}
              className="aspect-[4/3] w-full object-cover transition group-active:scale-[0.98]"
            />
            <span className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-pill bg-canvas/70 px-3 py-1.5 text-xs font-semibold backdrop-blur">
              <Maximize2 aria-hidden className="size-3.5" strokeWidth={2} />
              {copy.openLarge}
            </span>
          </button>

          <p className="-mt-2 text-sm text-ink-subtle">
            {TRIBES[photo.tribe]} · {copy.uploaded(formatTime(photo.createdAt))}
          </p>

          <PhotoEditForm key={photo.id} photo={photo} busy={busy} onSave={onSave} />

          <div className="grid grid-cols-2 gap-2 border-t border-line pt-4">
            {photo.status === "pending" && (
              <Button variant="secondary" onClick={onApprove} disabled={busy}>
                <Check aria-hidden className="size-4" strokeWidth={2.2} />
                {copy.approve}
              </Button>
            )}
            {photo.status === "hidden" ? (
              <Button variant="secondary" onClick={() => onSetHidden(false)} disabled={busy}>
                <Eye aria-hidden className="size-4" strokeWidth={1.8} />
                {copy.show}
              </Button>
            ) : (
              photo.status === "approved" && (
                <Button variant="secondary" onClick={() => onSetHidden(true)} disabled={busy}>
                  <EyeOff aria-hidden className="size-4" strokeWidth={1.8} />
                  {copy.hide}
                </Button>
              )
            )}
            <Button variant="danger" onClick={onDelete} disabled={busy}>
              <Trash2 aria-hidden className="size-4" strokeWidth={1.8} />
              {copy.delete}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
