import { PartyPopper, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Polaroid } from "@/components/ui/Polaroid";
import { captureCopy } from "@/features/capture/constants/copy";

export type SuccessViewProps = {
  previewUrl: string;
  caption: string | null;
  removed: boolean;
  busy: boolean;
  onAnother: () => void;
  onRemove: () => void;
};

export function SuccessView({
  previewUrl,
  caption,
  removed,
  busy,
  onAnother,
  onRemove,
}: SuccessViewProps) {
  if (removed) {
    return (
      <div className="flex flex-1 flex-col justify-center gap-6 text-center">
        <p className="text-lg text-ink-muted">{captureCopy.removed}</p>
        <Button variant="primary" size="lg" onClick={onAnother}>
          <Plus aria-hidden className="size-5" strokeWidth={1.8} />
          {captureCopy.another}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-8">
      <Polaroid
        src={previewUrl}
        alt={captureCopy.postedAlt}
        caption={caption}
        className="mx-auto w-[72%] animate-land"
      />
      <div className="flex flex-col items-center gap-3 text-center">
        <PartyPopper aria-hidden className="size-8 text-primary-text" strokeWidth={1.8} />
        <h2 className="text-3xl font-bold tracking-tight">{captureCopy.successTitle}</h2>
        <p className="text-ink-muted">{captureCopy.successBody}</p>
        <span className="rounded-pill border border-line bg-surface px-3 py-1 text-sm font-semibold text-primary-text">
          {captureCopy.hashtag}
        </span>
      </div>
      <div className="mt-auto flex flex-col gap-3">
        <Button variant="primary" size="lg" onClick={onAnother}>
          <Plus aria-hidden className="size-5" strokeWidth={1.8} />
          {captureCopy.another}
        </Button>
        <Button variant="danger" size="lg" onClick={onRemove} disabled={busy}>
          <Trash2 aria-hidden className="size-5" strokeWidth={1.8} />
          {busy ? captureCopy.removing : captureCopy.remove}
        </Button>
      </div>
    </div>
  );
}
