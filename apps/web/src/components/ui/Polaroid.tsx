import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type PolaroidProps = {
  src: string;
  alt: string;
  caption?: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function Polaroid({ src, alt, caption, footer, className }: PolaroidProps) {
  return (
    <figure className={cn("rounded-[6px] bg-paper p-3 pb-4 shadow-paper", className)}>
      <img src={src} alt={alt} className="aspect-square w-full rounded-[3px] object-cover" />
      <figcaption className="mt-3 min-h-6 px-1 text-center text-lg font-medium text-paper-ink">
        {caption}
      </figcaption>
      {footer}
    </figure>
  );
}
