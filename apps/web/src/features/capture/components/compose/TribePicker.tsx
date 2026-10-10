import { CATCH_ALL_TRIBE, type Tribe, TRIBES } from "@boothwall/shared";
import { Check } from "lucide-react";

import { captureCopy } from "@/features/capture/constants/copy";
import { cn } from "@/lib/cn";

export type TribePickerProps = {
  value: Tribe | null;
  onChange: (tribe: Tribe) => void;
};

export function TribePicker({ value, onChange }: TribePickerProps) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 text-sm font-medium text-ink-muted">{captureCopy.tribeLabel}</legend>
      <div className="grid grid-cols-2 gap-2">
        {(Object.entries(TRIBES) as [Tribe, string][]).map(([id, label]) => {
          const selected = value === id;
          return (
            <label
              key={id}
              className={cn(
                "flex h-12 cursor-pointer items-center justify-between gap-2 rounded-control border px-3.5 text-sm font-semibold transition has-focus-visible:outline-2 has-focus-visible:outline-offset-3 has-focus-visible:outline-ink",
                id === CATCH_ALL_TRIBE && "col-span-2",
                selected
                  ? "border-ink bg-ink text-ink-inverse"
                  : "border-line bg-surface text-ink hover:bg-surface-strong",
              )}
            >
              <input
                type="radio"
                name="tribe"
                value={id}
                checked={selected}
                onChange={() => onChange(id)}
                className="sr-only"
              />
              {label}
              {selected && <Check aria-hidden className="size-4" strokeWidth={2.4} />}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
