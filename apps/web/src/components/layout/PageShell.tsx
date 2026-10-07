import type { ReactNode } from "react";

import glow from "@/assets/brand/brand-glow.jpg";

import { BrandHeader } from "./BrandHeader";
import { SourceFooter } from "./SourceFooter";

export type PageShellProps = {
  children: ReactNode;
  onHome?: () => void;
};

export function PageShell({ children, onHome }: PageShellProps) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <img
        src={glow}
        alt=""
        aria-hidden
        className="pointer-events-none fixed -top-24 -right-40 w-[560px] max-w-none opacity-60 blur-2xl"
      />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <BrandHeader onHome={onHome} />
        <main className="flex flex-1 flex-col">{children}</main>
        <SourceFooter />
      </div>
    </div>
  );
}
