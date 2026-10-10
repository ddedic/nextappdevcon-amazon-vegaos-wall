import type { PhotoStatsDTO } from "@boothwall/shared";
import { useEffect, useState } from "react";

import { STATS_REFRESH_MS } from "@/features/control/constants/timing";
import { fetchStats } from "@/features/control/data/controlApi";
import type { ControlSession } from "@/features/control/hooks/useControlSession";

/** Local midnight: "today" is the booth's day, not UTC's. */
const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

/** Overview numbers, polled while the Overview tab is open. */
export function useControlStats({ passcode, fail }: ControlSession) {
  const [stats, setStats] = useState<PhotoStatsDTO | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!passcode) return;
    let cancelled = false;
    const load = () =>
      fetchStats(startOfToday(), passcode)
        .then((next) => {
          if (cancelled) return;
          setStats(next);
          setFailed(false);
        })
        .catch((err: unknown) => {
          if (!cancelled && !fail(err)) setFailed(true);
        });
    void load();
    const timer = setInterval(() => void load(), STATS_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [fail, passcode]);

  return { stats, failed };
}
