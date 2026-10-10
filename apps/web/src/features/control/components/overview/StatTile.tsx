import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/cn";

export type StatTileProps = {
  label: string;
  value: number | null;
  icon: LucideIcon;
  /** Draws the eye: the number someone at the booth should act on. */
  highlight?: boolean;
};

export function StatTile({ label, value, icon: Icon, highlight }: StatTileProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-card border p-4",
        highlight ? "border-primary/50 bg-primary/10" : "border-line bg-surface",
      )}
    >
      <Icon
        aria-hidden
        className={cn("size-5", highlight ? "text-primary-text" : "text-ink-subtle")}
        strokeWidth={1.8}
      />
      <div>
        <p className="text-3xl font-bold tracking-tight tabular-nums">
          {value === null ? (
            <span className="inline-block h-8 w-12 animate-pulse rounded-control bg-surface-strong align-middle" />
          ) : (
            value
          )}
        </p>
        <p className="text-sm text-ink-muted">{label}</p>
      </div>
    </div>
  );
}
