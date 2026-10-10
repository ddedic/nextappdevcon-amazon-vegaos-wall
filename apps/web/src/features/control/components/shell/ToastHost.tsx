import { X } from "lucide-react";

import { controlCopy } from "@/features/control/constants/copy";
import type { Toast } from "@/features/control/hooks/useControlSession";

export type ToastHostProps = {
  toast: Toast | null;
  onDismiss: () => void;
};

/** One toast at a time, above the bottom edge; announced politely to screen readers. */
export function ToastHost({ toast, onDismiss }: ToastHostProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
    >
      {toast && (
        <div
          key={toast.id}
          className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-control border border-line bg-paper py-2 pr-2 pl-4 text-sm font-medium text-paper-ink shadow-paper animate-rise-in"
        >
          <span className="flex-1">{toast.message}</span>
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action?.run();
                onDismiss();
              }}
              className="h-9 rounded-control px-3 font-semibold underline-offset-4 hover:underline"
            >
              {toast.action.label}
            </button>
          )}
          <button
            type="button"
            aria-label={controlCopy.sheet.close}
            onClick={onDismiss}
            className="flex size-9 items-center justify-center rounded-control"
          >
            <X aria-hidden className="size-4" strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  );
}
