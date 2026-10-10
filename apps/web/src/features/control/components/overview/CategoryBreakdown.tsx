import { type PhotoStatsDTO, TRIBES, tribeSchema } from "@boothwall/shared";

import { controlCopy } from "@/features/control/constants/copy";
import { cn } from "@/lib/cn";

export type CategoryBreakdownProps = {
  byTribe: PhotoStatsDTO["byTribe"];
};

const copy = controlCopy.overview;

/** One stacked bar per category, in config order: on the wall, waiting, hidden. */
export function CategoryBreakdown({ byTribe }: CategoryBreakdownProps) {
  const rows = tribeSchema.options.map((id) => {
    const counts = byTribe[id] ?? { onWall: 0, pending: 0, hidden: 0 };
    return { id, ...counts, total: counts.onWall + counts.pending + counts.hidden };
  });
  const max = Math.max(1, ...rows.map((row) => row.total));

  return (
    <section aria-labelledby="control-by-category" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="control-by-category" className="text-lg font-semibold">
          {copy.byCategory}
        </h2>
        <ul className="flex gap-3 text-xs text-ink-subtle">
          <Legend className="bg-success" label={copy.legend.onWall} />
          <Legend className="bg-primary" label={copy.legend.pending} />
          <Legend className="bg-ink-subtle" label={copy.legend.hidden} />
        </ul>
      </div>
      <ul className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">{TRIBES[row.id]}</span>
              <span className="text-ink-muted tabular-nums">
                {row.total}
                <span className="sr-only">
                  : {copy.categoryLine(row.onWall, row.pending, row.hidden)}
                </span>
              </span>
            </div>
            <div aria-hidden className="flex h-2 overflow-hidden rounded-pill bg-surface-strong">
              <Bar value={row.onWall} max={max} className="bg-success" />
              <Bar value={row.pending} max={max} className="bg-primary" />
              <Bar value={row.hidden} max={max} className="bg-ink-subtle" />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Bar({ value, max, className }: { value: number; max: number; className: string }) {
  return (
    <span
      className={cn("h-full transition-[width] duration-500", className)}
      style={{ width: `${(value / max) * 100}%` }}
    />
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <li className="flex items-center gap-1.5">
      <span aria-hidden className={cn("size-2 rounded-pill", className)} />
      {label}
    </li>
  );
}
