import { SHOWCASE_LABEL } from "@boothwall/shared";

import { REPO_URL } from "@/lib/links";

export function DemoChip() {
  return (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noreferrer"
      aria-label={`${SHOWCASE_LABEL}, source on GitHub`}
      className="shrink-0 rounded-pill bg-primary px-2.5 py-1 whitespace-nowrap text-2xs font-extrabold tracking-caps text-on-primary uppercase transition hover:brightness-110"
    >
      {SHOWCASE_LABEL}
    </a>
  );
}
