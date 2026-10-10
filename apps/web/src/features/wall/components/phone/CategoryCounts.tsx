import { CATCH_ALL_TRIBE, type Tribe, TRIBES, type WallStatsDTO } from "@boothwall/shared";

import { wallCopy } from "@/features/wall/constants/copy";
import { cn } from "@/lib/cn";

interface CategoryCountsProps {
  stats: WallStatsDTO;
}

/** The TV's "Who's here" battle as a list: one bar per category, scaled to the leader. */
export function CategoryCounts({ stats }: CategoryCountsProps) {
  const rows = (Object.keys(TRIBES) as Tribe[]).map((id) => ({
    id,
    label: TRIBES[id],
    count: stats.byTribe[id] ?? 0,
  }));
  const leader = Math.max(1, ...rows.map((row) => row.count));

  return (
    <section className="rounded-card border border-line bg-surface p-4 backdrop-blur">
      <h2 className="mb-3 text-sm font-bold">{wallCopy.phone.whoIsHere}</h2>
      <ul className="flex flex-col gap-2.5">
        {rows.map((row) => (
          <li
            key={row.id}
            className={cn("text-sm", row.id === CATCH_ALL_TRIBE ? "text-ink-subtle" : "text-ink")}
          >
            <div className="mb-1 flex justify-between gap-3">
              <span>{row.label}</span>
              <span className="font-semibold tabular-nums">{row.count}</span>
            </div>
            <div className="h-1 overflow-hidden rounded-pill bg-line">
              <div
                className="h-full rounded-pill bg-primary"
                style={{ width: `${(row.count / leader) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
