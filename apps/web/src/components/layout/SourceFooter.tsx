import { GitHubIcon } from "@/components/brand/GitHubIcon";
import { AUTHOR_HANDLE, REPO_URL } from "@/lib/links";

export function SourceFooter() {
  return (
    <footer className="mt-10 flex flex-col items-center gap-2">
      <a
        href={REPO_URL}
        target="_blank"
        rel="noreferrer"
        aria-label={`Source on GitHub by ${AUTHOR_HANDLE}`}
        className="inline-flex items-center gap-2 rounded-pill px-3 py-1.5 text-sm font-semibold text-ink-muted transition hover:bg-surface hover:text-ink"
      >
        <GitHubIcon className="size-5 text-ink" />
        {AUTHOR_HANDLE}
      </a>
      <p className="text-center text-xs text-ink-subtle">
        Built with React Native for Vega OS · Fire TV
      </p>
    </footer>
  );
}
