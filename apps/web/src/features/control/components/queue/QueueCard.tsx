import { type PhotoDTO, TRIBES } from "@boothwall/shared";
import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { controlCopy } from "@/features/control/constants/copy";
import type { QueueAction } from "@/features/control/hooks/useQueue";
import { formatTime } from "@/lib/formatTime";

export type QueueCardProps = {
  photo: PhotoDTO;
  /** What's in flight for this photo, if anything. */
  busy: QueueAction | null;
  /** Approve all is running: hold every card. */
  locked: boolean;
  onApprove: () => void;
  onReject: () => void;
};

export function QueueCard({ photo, busy, locked, onApprove, onReject }: QueueCardProps) {
  const { queue } = controlCopy;
  return (
    <li className="overflow-hidden rounded-card border border-line bg-surface animate-rise-in">
      <img
        src={photo.imageUrl}
        alt={photo.caption ?? controlCopy.photoAlt}
        className="aspect-square w-full object-cover"
      />
      <div className="flex flex-col gap-3 p-4">
        <div>
          <p className="font-medium">{photo.caption ?? controlCopy.noCaption}</p>
          <p className="text-sm text-ink-subtle">
            {TRIBES[photo.tribe]} · {formatTime(photo.createdAt)}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="danger" onClick={onReject} disabled={locked || busy !== null}>
            <X aria-hidden className="size-4" strokeWidth={1.8} />
            {busy === "reject" ? queue.rejecting : queue.reject}
          </Button>
          <Button variant="primary" onClick={onApprove} disabled={locked || busy !== null}>
            <Check aria-hidden className="size-4" strokeWidth={2.2} />
            {busy === "approve" ? queue.approving : queue.approve}
          </Button>
        </div>
      </div>
    </li>
  );
}
