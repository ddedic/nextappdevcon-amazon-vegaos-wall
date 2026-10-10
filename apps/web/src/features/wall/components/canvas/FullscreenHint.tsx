import { wallCopy } from "@/features/wall/constants/copy";
import { cn } from "@/lib/cn";

interface FullscreenHintProps {
  visible: boolean;
}

/** A small chip that tells a mouse-and-keyboard visitor how to go full screen, then fades. */
export function FullscreenHint({ visible }: FullscreenHintProps) {
  return (
    <div
      role="status"
      aria-hidden={!visible}
      data-testid="fullscreen-hint"
      className={cn(
        "pointer-events-none fixed bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-pill border border-line bg-surface-strong px-4 py-2 text-sm font-semibold text-ink backdrop-blur transition-opacity duration-500",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      {wallCopy.fullscreenHint}
    </div>
  );
}
