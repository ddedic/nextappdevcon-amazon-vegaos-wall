import { type ReactNode, useEffect, useRef } from "react";

import { cn } from "@/lib/cn";

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  /** Accessible name; or point `labelledBy` at a visible heading. */
  label?: string;
  labelledBy?: string;
  /** sheet: slides up from the bottom (phones); center: a small alert; full: edge to edge. */
  variant?: "sheet" | "center" | "full";
  className?: string;
  children: ReactNode;
};

const VARIANTS = {
  sheet:
    "mx-auto mt-auto mb-0 max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-card border border-b-0 border-line bg-canvas animate-sheet-in",
  center:
    "m-auto w-[calc(100%-2.5rem)] max-w-sm rounded-card border border-line bg-canvas animate-pop-in",
  full: "m-0 h-dvh max-h-none w-screen max-w-none bg-canvas animate-pop-in",
};

/**
 * A modal on the native `<dialog>`: focus is trapped and restored, Escape closes it and the
 * page behind is inert. Tapping the backdrop closes it too.
 */
export function Dialog({
  open,
  onClose,
  label,
  labelledBy,
  variant = "sheet",
  className,
  children,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal?.();
    else if (!open && dialog.open) dialog.close?.();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={cn(
        "p-0 text-ink backdrop:bg-canvas/70 backdrop:backdrop-blur-sm",
        VARIANTS[variant],
        className,
      )}
    >
      {open && children}
    </dialog>
  );
}
