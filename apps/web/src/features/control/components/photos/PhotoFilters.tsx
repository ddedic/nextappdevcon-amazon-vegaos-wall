import {
  type PhotoSort,
  photoSortSchema,
  type PhotoStatus,
  type Tribe,
  TRIBES,
  tribeSchema,
} from "@boothwall/shared";
import { ChevronDown, Search, X } from "lucide-react";
import type { ReactNode } from "react";

import { controlCopy } from "@/features/control/constants/copy";
import { cn } from "@/lib/cn";

export type PhotoFilterValues = {
  status?: PhotoStatus;
  tribe?: Tribe;
  search: string;
  sort: PhotoSort;
};

export type PhotoFiltersProps = {
  value: PhotoFilterValues;
  onChange: (next: PhotoFilterValues) => void;
};

const copy = controlCopy.photos;
const STATUS_OPTIONS = [undefined, "approved", "pending", "hidden"] as const satisfies readonly (
  PhotoStatus | undefined
)[];

/** Search, status chips, then category and sort side by side: all one thumb can reach. */
export function PhotoFilters({ value, onChange }: PhotoFiltersProps) {
  const set = (patch: Partial<PhotoFilterValues>) => onChange({ ...value, ...patch });

  return (
    <div className="flex flex-col gap-3">
      <label className="relative block">
        <span className="sr-only">{copy.search}</span>
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-subtle"
          strokeWidth={2}
        />
        <input
          type="search"
          enterKeyHint="search"
          placeholder={copy.search}
          value={value.search}
          onChange={(event) => set({ search: event.target.value })}
          className="h-12 w-full rounded-control border border-line bg-surface pr-11 pl-10 text-base text-ink placeholder:text-ink-subtle focus:border-ink focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {value.search && (
          <button
            type="button"
            aria-label={copy.clearSearch}
            onClick={() => set({ search: "" })}
            className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-pill text-ink-muted transition hover:bg-surface-strong active:scale-90"
          >
            <X aria-hidden className="size-4" strokeWidth={2} />
          </button>
        )}
      </label>

      <fieldset className="flex gap-1 rounded-control border border-line bg-surface p-1">
        <legend className="sr-only">{copy.statusFilter}</legend>
        {STATUS_OPTIONS.map((status) => (
          <label
            key={status ?? "all"}
            className={cn(
              "flex h-9 flex-1 cursor-pointer items-center justify-center rounded-control text-sm font-semibold transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ink",
              value.status === status ? "bg-ink text-ink-inverse" : "text-ink-muted hover:text-ink",
            )}
          >
            <input
              type="radio"
              name="photo-status"
              className="sr-only"
              checked={value.status === status}
              onChange={() => set({ status })}
            />
            {status ? controlCopy.status[status] : copy.allStatuses}
          </label>
        ))}
      </fieldset>

      <div className="grid grid-cols-2 gap-2">
        <Select
          label={copy.category}
          value={value.tribe ?? ""}
          onChange={(next) => set({ tribe: tribeSchema.safeParse(next).data })}
        >
          <option value="">{copy.allCategories}</option>
          {tribeSchema.options.map((id) => (
            <option key={id} value={id}>
              {TRIBES[id]}
            </option>
          ))}
        </Select>
        <Select
          label={copy.sort}
          value={value.sort}
          onChange={(next) => set({ sort: photoSortSchema.parse(next) })}
        >
          {photoSortSchema.options.map((sort) => (
            <option key={sort} value={sort}>
              {copy.sorts[sort]}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}

type SelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
};

function Select({ label, value, onChange, children }: SelectProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className="px-1 text-xs font-medium text-ink-subtle">{label}</span>
      <span className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full appearance-none rounded-control border border-line bg-surface pr-9 pl-3 text-sm font-medium text-ink focus:border-ink focus:outline-none"
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-subtle"
          strokeWidth={2}
        />
      </span>
    </label>
  );
}
