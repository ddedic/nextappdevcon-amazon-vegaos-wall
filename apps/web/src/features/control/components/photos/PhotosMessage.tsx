import { ImageOff, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/Button";

export type PhotosMessageProps = {
  tone: "empty" | "error";
  message: string;
  action?: { label: string; run: () => void };
};

/** Empty and error states of the photo list. */
export function PhotosMessage({ tone, message, action }: PhotosMessageProps) {
  const Icon = tone === "error" ? TriangleAlert : ImageOff;
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className="flex flex-col items-center gap-3 rounded-card border border-dashed border-line px-6 py-12 text-center animate-rise-in"
    >
      <Icon aria-hidden className="size-8 text-ink-subtle" strokeWidth={1.6} />
      <p className="text-ink-muted">{message}</p>
      {action && (
        <Button variant="secondary" onClick={action.run}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
