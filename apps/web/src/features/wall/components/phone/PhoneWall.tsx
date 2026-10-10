import { EVENT } from "@boothwall/shared";

import { PageShell } from "@/components/layout/PageShell";
import { CategoryCounts } from "@/features/wall/components/phone/CategoryCounts";
import { PhotoFeed } from "@/features/wall/components/phone/PhotoFeed";
import { SnapButton } from "@/features/wall/components/shared/SnapButton";
import { wallCopy } from "@/features/wall/constants/copy";
import { type LiveWallStatus, useLiveWall } from "@/features/wall/hooks/useLiveWall";
import { cn } from "@/lib/cn";

interface PhoneWallProps {
  demo: boolean;
}

const STATUS_DOT: Record<LiveWallStatus, string> = {
  demo: "bg-primary",
  connecting: "bg-ink-subtle animate-pulse",
  live: "bg-success",
};

/**
 * The wall for a phone held upright: what's on the TV as a feed, newest first, with the
 * category counts and a big way in. The TV canvas comes back when the phone turns sideways.
 */
export function PhoneWall({ demo }: PhoneWallProps) {
  const { snapshot, status } = useLiveWall(demo);
  const total = snapshot?.stats.total ?? 0;

  return (
    <PageShell>
      <section className="mt-10 mb-6">
        <p className="mb-3 text-xs font-bold tracking-eyebrow text-primary-text uppercase">
          {wallCopy.phone.eyebrow}
          {EVENT.venue ? ` · ${EVENT.venue}` : ""}
        </p>
        <h1 className="text-4xl leading-display font-bold tracking-tight">
          {wallCopy.phone.title}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-ink-muted">{wallCopy.phone.intro}</p>
        <p className="mt-4 flex items-center gap-3 text-sm" data-testid="phone-wall-status">
          <span className="inline-flex items-center gap-2 rounded-pill border border-line bg-surface px-3 py-1 font-semibold">
            <span className={cn("size-2 rounded-pill", STATUS_DOT[status])} />
            {wallCopy.phone.status[status]}
          </span>
          <span className="text-ink-muted">{wallCopy.phone.moments(total)}</span>
        </p>
      </section>

      {snapshot && total > 0 && (
        <div className="mb-6">
          <CategoryCounts stats={snapshot.stats} />
        </div>
      )}

      {snapshot && <PhotoFeed photos={snapshot.photos} />}

      <p className="mt-8 text-center text-xs text-ink-subtle">{wallCopy.phone.rotate}</p>
      {/* Room for the fixed button, so it never covers the last row or the footer. */}
      <div className="h-20" aria-hidden />
      <SnapButton />
    </PageShell>
  );
}
