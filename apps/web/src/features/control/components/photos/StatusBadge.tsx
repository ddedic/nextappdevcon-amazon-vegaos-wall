import type { PhotoStatus } from "@boothwall/shared";
import { Clock, EyeOff } from "lucide-react";

import { controlCopy } from "@/features/control/constants/copy";
import { cn } from "@/lib/cn";

const STYLES: Record<PhotoStatus, string> = {
  approved: "bg-success text-ink-inverse",
  pending: "bg-primary text-on-primary",
  hidden: "bg-ink-subtle text-ink-inverse",
};

/** Pending and hidden are flagged; "on wall" is the quiet default. */
export function StatusBadge({ status, className }: { status: PhotoStatus; className?: string }) {
  if (status === "approved") return null;
  const Icon = status === "pending" ? Clock : EyeOff;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-xs font-semibold",
        STYLES[status],
        className,
      )}
    >
      <Icon aria-hidden className="size-3" strokeWidth={2.4} />
      {controlCopy.status[status]}
    </span>
  );
}
