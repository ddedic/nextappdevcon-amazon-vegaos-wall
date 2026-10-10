import { useId } from "react";

import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { controlCopy } from "@/features/control/constants/copy";

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** In-page confirm, so it looks like the panel and works the same on every phone. */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  danger,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  return (
    <Dialog open={open} onClose={onCancel} labelledBy={titleId} variant="center">
      <div role="alertdialog" aria-labelledby={titleId} className="flex flex-col gap-4 p-5">
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>
        {body && <p className="text-sm text-ink-muted">{body}</p>}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={onCancel} autoFocus>
            {controlCopy.confirm.cancel}
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
