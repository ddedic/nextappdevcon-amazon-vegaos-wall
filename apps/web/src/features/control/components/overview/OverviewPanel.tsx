import { Clock, EyeOff, MonitorPlay, Upload } from "lucide-react";

import { CategoryBreakdown } from "@/features/control/components/overview/CategoryBreakdown";
import { StatTile } from "@/features/control/components/overview/StatTile";
import { controlCopy } from "@/features/control/constants/copy";
import type { ControlSession } from "@/features/control/hooks/useControlSession";
import { useControlStats } from "@/features/control/hooks/useControlStats";

const copy = controlCopy.overview;

/** Live numbers for the booth, refreshed every few seconds while open. */
export function OverviewPanel({ session }: { session: ControlSession }) {
  const { stats, failed } = useControlStats(session);
  return (
    <div className="flex flex-col gap-6">
      {failed && (
        <p
          role="alert"
          className="rounded-control border border-primary/40 bg-primary/10 p-3 text-sm"
        >
          {copy.loadFailed}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <StatTile label={copy.onWall} value={stats?.onWall ?? null} icon={MonitorPlay} />
        <StatTile
          label={copy.pending}
          value={stats?.pending ?? null}
          icon={Clock}
          highlight={(stats?.pending ?? 0) > 0}
        />
        <StatTile label={copy.hidden} value={stats?.hidden ?? null} icon={EyeOff} />
        <StatTile label={copy.uploadsToday} value={stats?.uploadsToday ?? null} icon={Upload} />
      </div>
      {stats && <CategoryBreakdown byTribe={stats.byTribe} />}
    </div>
  );
}
