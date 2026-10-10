import { CheckCheck } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/features/control/components/shell/ConfirmDialog";
import { controlCopy } from "@/features/control/constants/copy";
import type { useQueue } from "@/features/control/hooks/useQueue";

import { QueueCard } from "./QueueCard";

export type QueuePanelProps = {
  queue: ReturnType<typeof useQueue>;
};

/** Today's approve / reject flow: oldest first, so nobody waits too long. */
export function QueuePanel({ queue }: QueuePanelProps) {
  const [confirming, setConfirming] = useState(false);
  const { pending, bulk } = queue;
  const copy = controlCopy.queue;

  if (!queue.loaded) {
    return (
      <div aria-busy className="flex flex-col gap-4">
        <div className="aspect-square animate-pulse rounded-card bg-surface" />
      </div>
    );
  }

  return (
    <>
      {pending.length >= 2 && (
        <Button
          variant="primary"
          size="lg"
          className="mb-4"
          onClick={() => setConfirming(true)}
          disabled={bulk !== null}
        >
          <CheckCheck aria-hidden className="size-5" strokeWidth={2} />
          {bulk ? copy.approvingAll(bulk.done, bulk.total) : copy.approveAll(pending.length)}
        </Button>
      )}

      {pending.length === 0 && <p className="py-10 text-center text-ink-muted">{copy.empty}</p>}

      <ul className="flex flex-col gap-4">
        {pending.map((photo) => (
          <QueueCard
            key={photo.id}
            photo={photo}
            busy={queue.busy?.id === photo.id ? queue.busy.action : null}
            locked={bulk !== null}
            onApprove={() => void queue.approve(photo.id)}
            onReject={() => void queue.reject(photo.id)}
          />
        ))}
      </ul>

      <ConfirmDialog
        open={confirming}
        title={copy.confirmApproveAll(pending.length)}
        confirmLabel={copy.approveAll(pending.length)}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          void queue.approveAll();
        }}
      />
    </>
  );
}
