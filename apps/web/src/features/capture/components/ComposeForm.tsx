import { PHOTO_LIMITS, type Tribe } from "@vegaos-demo/shared";
import { ChevronLeft, Send } from "lucide-react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Polaroid } from "@/components/ui/Polaroid";
import { captureCopy } from "@/features/capture/constants/copy";

import { TribePicker } from "./TribePicker";

export type ComposeFormProps = {
  previewUrl: string;
  caption: string;
  onCaptionChange: (value: string) => void;
  tribe: Tribe | null;
  onTribeChange: (tribe: Tribe) => void;
  consent: boolean;
  onConsentChange: (value: boolean) => void;
  canSubmit: boolean;
  sending: boolean;
  onSubmit: () => void;
  onRetake: () => void;
};

export function ComposeForm(props: ComposeFormProps) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    props.onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-7">
      <button
        type="button"
        onClick={props.onRetake}
        className="-mb-3 inline-flex items-center gap-1 self-start text-sm font-medium text-ink-muted hover:text-ink"
      >
        <ChevronLeft aria-hidden className="size-4" strokeWidth={2} />
        {captureCopy.back}
      </button>
      <div className="flex flex-col items-center gap-3">
        <Polaroid
          src={props.previewUrl}
          alt="Your photo"
          caption={
            props.caption || (
              <span className="text-paper-ink/35">{captureCopy.captionPlaceholder}</span>
            )
          }
          className="w-[78%] -rotate-2"
        />
        <button
          type="button"
          onClick={props.onRetake}
          className="text-sm font-medium text-ink-muted underline-offset-4 hover:text-ink hover:underline"
        >
          {captureCopy.retake}
        </button>
      </div>

      <label className="flex flex-col gap-2">
        <span className="flex justify-between text-sm font-medium text-ink-muted">
          {captureCopy.captionLabel}
          <span className="tabular-nums text-ink-subtle">
            {props.caption.length}/{PHOTO_LIMITS.captionMaxLength}
          </span>
        </span>
        <input
          value={props.caption}
          onChange={(event) => props.onCaptionChange(event.target.value)}
          maxLength={PHOTO_LIMITS.captionMaxLength}
          placeholder={captureCopy.captionPlaceholder}
          className="h-12 rounded-control border border-line bg-surface px-4 text-base text-ink placeholder:text-ink-subtle focus:border-ink focus:outline-none"
        />
      </label>

      <TribePicker value={props.tribe} onChange={props.onTribeChange} />

      <label className="flex cursor-pointer items-start gap-3 rounded-control border border-line bg-surface p-4 text-sm leading-relaxed text-ink-muted">
        <input
          type="checkbox"
          checked={props.consent}
          onChange={(event) => props.onConsentChange(event.target.checked)}
          className="mt-0.5 size-5 shrink-0 accent-pink"
        />
        {captureCopy.consent}
      </label>

      <div className="sticky bottom-0 -mx-5 mt-auto bg-linear-to-t from-canvas via-canvas/90 to-transparent px-5 pt-6 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <Button
          type="submit"
          variant="brand"
          size="lg"
          disabled={!props.canSubmit || props.sending}
        >
          <Send aria-hidden className="size-5" strokeWidth={1.8} />
          {props.sending ? captureCopy.sending : captureCopy.submit}
        </Button>
      </div>
    </form>
  );
}
