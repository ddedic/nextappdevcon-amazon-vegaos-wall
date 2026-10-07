import logo from "@/assets/brand/brand-devcon-logo.png";
import { DemoChip } from "@/components/brand/DemoChip";

export type BrandHeaderProps = {
  /** Go back to the start in place; without it the logo links to the capture page. */
  onHome?: () => void;
};

export function BrandHeader({ onHome }: BrandHeaderProps) {
  const logoImage = <img src={logo} alt="next.app devCon, back to start" className="h-8 w-auto" />;

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
        <a href="/" className="rounded-control transition active:scale-95">
          {logoImage}
        </a>
      )}
      <DemoChip />
    </header>
  );
}
