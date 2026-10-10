import { Eye, EyeOff, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { controlCopy } from "@/features/control/constants/copy";
import type { BulkAction, BulkProgress } from "@/features/control/hooks/usePhotoLibrary";

export type BulkBarProps = {
  count: number;
  progress: BulkProgress | null;
  onAction: (action: BulkAction) => void;
};

const copy = controlCopy.bulk;

/** Sticks to the bottom in select mode; turns into a progress bar while a bulk action runs. */
export function BulkBar({ count, progress, onAction }: BulkBarProps) {
  const disabled = count === 0 || progress !== null;
  return (
    <div className="sticky bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 mt-4 rounded-card border border-line bg-canvas/90 p-3 shadow-paper backdrop-blur-md animate-rise-in">
      {progress ? (
        <div className="flex flex-col gap-2 py-1" aria-live="polite">
          <p className="text-sm font-medium">
            {copy.working(copy.verbs[progress.action], progress.done, progress.total)}
          </p>
          <progress
            value={progress.done}
            max={Math.max(progress.total, 1)}
            className="h-2 w-full overflow-hidden rounded-pill [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-surface-strong [&::-webkit-progress-value]:bg-primary [&::-webkit-progress-value]:transition-all"
          />
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <p className="flex-1 pl-1 text-sm font-semibold tabular-nums">{copy.selected(count)}</p>
          <Button variant="secondary" onClick={() => onAction("hide")} disabled={disabled}>
            <EyeOff aria-hidden className="size-4" strokeWidth={1.8} />
            {copy.hide}
          </Button>
          <Button variant="secondary" onClick={() => onAction("show")} disabled={disabled}>
            <Eye aria-hidden className="size-4" strokeWidth={1.8} />
            {copy.show}
          </Button>
          <Button
            variant="danger"
            onClick={() => onAction("delete")}
            disabled={disabled}
            aria-label={copy.delete}
          >
            <Trash2 aria-hidden className="size-4" strokeWidth={1.8} />
          </Button>
        </div>
      )}
    </div>
  );
}
