import { PHOTO_LIMITS, type PhotoDTO, type Tribe, TRIBES, tribeSchema } from "@boothwall/shared";
import { type FormEvent, useId, useState } from "react";

import { Button } from "@/components/ui/Button";
import { controlCopy } from "@/features/control/constants/copy";
import type { PhotoEdit } from "@/features/control/hooks/usePhotoLibrary";
import { cn } from "@/lib/cn";

export type PhotoEditFormProps = {
  photo: PhotoDTO;
  busy: boolean;
  onSave: (edit: PhotoEdit) => Promise<boolean>;
};

const copy = controlCopy.sheet;

/** Caption and category. Saving is optimistic; the form keeps the draft if it fails. */
export function PhotoEditForm({ photo, busy, onSave }: PhotoEditFormProps) {
  const [caption, setCaption] = useState(photo.caption ?? "");
  const [tribe, setTribe] = useState<Tribe>(photo.tribe);
  const [saving, setSaving] = useState(false);
  const captionId = useId();
  const hintId = useId();

  const dirty = caption.trim() !== (photo.caption ?? "") || tribe !== photo.tribe;
  const left = PHOTO_LIMITS.captionMaxLength - caption.length;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    await onSave({ caption, tribe });
    setSaving(false);
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={captionId} className="text-sm font-medium text-ink-muted">
          {copy.caption}
        </label>
        <input
          id={captionId}
          value={caption}
          maxLength={PHOTO_LIMITS.captionMaxLength}
          aria-describedby={hintId}
          onChange={(event) => setCaption(event.target.value)}
          className="h-12 rounded-control border border-line bg-surface px-4 text-base text-ink focus:border-ink focus:outline-none"
        />
        <p id={hintId} className="px-1 text-xs text-ink-subtle tabular-nums">
          {copy.captionHint(left)}
        </p>
      </div>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-medium text-ink-muted">{copy.category}</legend>
        <div className="flex flex-wrap gap-2">
          {tribeSchema.options.map((id) => (
            <label
              key={id}
              className={cn(
                "flex h-9 cursor-pointer items-center rounded-pill border px-3 text-sm font-medium transition active:scale-95 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ink",
                tribe === id
                  ? "border-ink bg-ink text-ink-inverse"
                  : "border-line bg-surface text-ink-muted hover:text-ink",
              )}
            >
              <input
                type="radio"
                name="photo-category"
                className="sr-only"
                checked={tribe === id}
                onChange={() => setTribe(id)}
              />
              {TRIBES[id]}
            </label>
          ))}
        </div>
      </fieldset>

      <Button type="submit" variant="primary" disabled={!dirty || saving || busy}>
        {saving ? copy.saving : copy.save}
      </Button>
    </form>
  );
}
