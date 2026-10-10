import { EVENT } from "@boothwall/shared";

import logo from "@/assets/brand/logo.png";
import { DemoChip } from "@/components/brand/DemoChip";
import { SNAP_PATH } from "@/lib/links";

export type BrandHeaderProps = {
  /** Go back to the start in place; without it the logo links to the upload page. */
  onHome?: () => void;
};

export function BrandHeader({ onHome }: BrandHeaderProps) {
  const logoImage = (
    <img src={logo} alt={`${EVENT.name}, back to start`} className="h-7 w-auto min-w-0 shrink" />
  );

  return (
    <header className="flex items-center justify-between gap-3">
      {onHome ? (
        <button
          type="button"
          onClick={onHome}
          className="rounded-control transition active:scale-95"
        >
          {logoImage}
        </button>
      ) : (
        <a href={SNAP_PATH} className="rounded-control transition active:scale-95">
          {logoImage}
        </a>
      )}
      <DemoChip />
    </header>
  );
}
