import type { RemoteCommand } from "@boothwall/shared";
import { ArrowLeft, ChevronLeft, ChevronRight, Pause } from "lucide-react";
import type { ReactNode } from "react";

import { controlCopy } from "@/features/control/constants/copy";
import { cn } from "@/lib/cn";

export type RemotePadProps = {
  onPress: (command: RemoteCommand) => void;
};

/** Phone stand-in for the Fire TV remote; presses travel API → Durable Object → every wall. */
export function RemotePad({ onPress }: RemotePadProps) {
  const vibrate = () => navigator.vibrate?.(12);
  const press = (command: RemoteCommand) => () => {
    vibrate();
    onPress(command);
  };

  return (
    <section className="flex flex-col items-center gap-8 py-6">
      <p className="text-center text-sm text-ink-muted">{controlCopy.remote.hint}</p>

      <div className="relative size-64 rounded-pill border border-line bg-surface backdrop-blur">
        <PadButton
          label={controlCopy.remote.left}
          onClick={press("left")}
          className="absolute top-1/2 left-2 -translate-y-1/2"
        >
          <ChevronLeft aria-hidden className="size-9" strokeWidth={1.8} />
        </PadButton>
        <PadButton
          label={controlCopy.remote.right}
          onClick={press("right")}
          className="absolute top-1/2 right-2 -translate-y-1/2"
        >
          <ChevronRight aria-hidden className="size-9" strokeWidth={1.8} />
        </PadButton>
        <button
          type="button"
          aria-label={controlCopy.remote.select}
          onClick={press("select")}
          className="absolute top-1/2 left-1/2 flex size-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-pill bg-primary text-xl font-bold text-on-primary shadow-glow transition active:scale-95"
        >
          OK
        </button>
      </div>

      <div className="grid w-full grid-cols-2 gap-3">
        <PadButton label={controlCopy.remote.back} onClick={press("back")} wide>
          <ArrowLeft aria-hidden className="size-6" strokeWidth={1.8} />
        </PadButton>
        <PadButton label={controlCopy.remote.playpause} onClick={press("playpause")} wide>
          <Pause aria-hidden className="size-6" strokeWidth={1.8} />
        </PadButton>
      </div>
    </section>
  );
}

type PadButtonProps = {
  label: string;
  onClick: () => void;
  children: ReactNode;
  wide?: boolean;
  className?: string;
};

function PadButton({ label, onClick, children, wide, className }: PadButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex items-center justify-center rounded-pill text-ink transition hover:bg-surface-strong active:scale-95",
        wide ? "h-14 border border-line bg-surface" : "size-16",
        className,
      )}
    >
      {children}
    </button>
  );
}
