import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/cn";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary: "bg-ink text-ink-inverse hover:bg-ink-muted",
        brand:
          "bg-linear-to-r from-pink via-violet to-blue text-ink shadow-glow hover:brightness-110",
        secondary: "border border-line bg-surface text-ink backdrop-blur hover:bg-surface-strong",
        ghost: "text-ink-muted hover:text-ink",
        danger: "border border-danger/40 text-danger hover:bg-danger/10",
      },
      size: {
        md: "h-11 rounded-control px-4 text-sm",
        lg: "h-14 w-full rounded-card px-6 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = ComponentPropsWithoutRef<"button"> & VariantProps<typeof buttonVariants>;

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return (
    <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
