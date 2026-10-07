import { REPO_URL } from "@/lib/links";

export function DemoChip() {
  return (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Amazon Vega OS showcase, source on GitHub"
      className="rounded-pill bg-pink px-2.5 py-1 text-[10px] font-extrabold tracking-[0.12em] text-ink-inverse uppercase transition hover:brightness-110"
    >
      Amazon Vega OS showcase
    </a>
  );
}
