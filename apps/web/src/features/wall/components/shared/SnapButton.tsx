import { buttonVariants } from "@/components/ui/Button";
import { wallCopy } from "@/features/wall/constants/copy";
import { cn } from "@/lib/cn";
import { SNAP_PATH } from "@/lib/links";

/** On a phone the wall is something to look at, so it offers the way to join in. */
export function SnapButton() {
  return (
    <a
      href={SNAP_PATH}
      data-testid="snap-button"
      className={cn(
        buttonVariants({ variant: "brand", size: "lg" }),
        "fixed inset-x-4 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-10 mx-auto w-auto max-w-md",
      )}
    >
      {wallCopy.snapButton}
    </a>
  );
}
