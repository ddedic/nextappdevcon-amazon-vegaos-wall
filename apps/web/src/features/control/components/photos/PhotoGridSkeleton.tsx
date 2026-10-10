/** Placeholder tiles while the first page loads. */
export function PhotoGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul aria-hidden className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="overflow-hidden rounded-card border border-line bg-surface">
          <div className="aspect-square animate-pulse bg-surface-strong" />
          <div className="flex flex-col gap-2 px-3 py-3">
            <div className="h-3 w-3/4 animate-pulse rounded-pill bg-surface-strong" />
            <div className="h-2.5 w-1/2 animate-pulse rounded-pill bg-surface-strong" />
          </div>
        </li>
      ))}
    </ul>
  );
}
