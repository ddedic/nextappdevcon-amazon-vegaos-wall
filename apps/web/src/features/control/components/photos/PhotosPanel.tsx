import type { PhotoDTO } from "@boothwall/shared";
import { CheckSquare, RefreshCw } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { BulkBar } from "@/features/control/components/photos/BulkBar";
import { Lightbox } from "@/features/control/components/photos/Lightbox";
import {
  PhotoFilters,
  type PhotoFilterValues,
} from "@/features/control/components/photos/PhotoFilters";
import { PhotoGridSkeleton } from "@/features/control/components/photos/PhotoGridSkeleton";
import { PhotoSheet } from "@/features/control/components/photos/PhotoSheet";
import { PhotosMessage } from "@/features/control/components/photos/PhotosMessage";
import { PhotoTile } from "@/features/control/components/photos/PhotoTile";
import { ConfirmDialog } from "@/features/control/components/shell/ConfirmDialog";
import { controlCopy } from "@/features/control/constants/copy";
import { SEARCH_DEBOUNCE_MS } from "@/features/control/constants/timing";
import type { ControlSession } from "@/features/control/hooks/useControlSession";
import { useDebouncedValue } from "@/features/control/hooks/useDebouncedValue";
import { useInfiniteScroll } from "@/features/control/hooks/useInfiniteScroll";
import { type BulkAction, usePhotoLibrary } from "@/features/control/hooks/usePhotoLibrary";
import { usePhotoSelection } from "@/features/control/hooks/usePhotoSelection";
import { cn } from "@/lib/cn";

const INITIAL_FILTERS: PhotoFilterValues = { search: "", sort: "newest" };

type Confirmation = { kind: "bulk"; action: BulkAction } | { kind: "delete"; photo: PhotoDTO };

const copy = controlCopy.photos;

/** Every photo, searchable, with per-photo and bulk actions. */
export function PhotosPanel({ session }: { session: ControlSession }) {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const q = useDebouncedValue(filters.search, SEARCH_DEBOUNCE_MS);
  const library = usePhotoLibrary(session, { ...filters, q });
  const selection = usePhotoSelection(library.photos);
  const [openId, setOpenId] = useState<string | null>(null);
  const [large, setLarge] = useState<PhotoDTO | null>(null);
  const [confirm, setConfirm] = useState<Confirmation | null>(null);
  const sentinel = useInfiniteScroll<HTMLDivElement>(
    () => void library.loadMore(),
    library.hasMore && !library.moreFailed,
  );

  // The sheet follows the list, so optimistic changes show in it too; a deleted photo closes it.
  const open = library.photos.find((photo) => photo.id === openId) ?? null;
  const filtered = filters.status !== undefined || filters.tribe !== undefined || q !== "";
  const { photos } = library;

  const runConfirmed = async () => {
    if (!confirm) return;
    setConfirm(null);
    if (confirm.kind === "delete") {
      if (await library.remove(confirm.photo)) setOpenId(null);
      return;
    }
    if (await library.runBulk(confirm.action, selection.selected)) selection.stop();
  };

  const confirmCopy = (() => {
    if (!confirm) return { title: "", body: "", label: "" };
    if (confirm.kind === "delete") {
      return {
        title: controlCopy.confirm.deleteOne,
        body: controlCopy.confirm.deleteBody,
        label: controlCopy.confirm.delete,
      };
    }
    const n = selection.selected.length;
    return {
      delete: {
        title: controlCopy.bulk.confirmDelete(n),
        body: controlCopy.confirm.deleteBody,
        label: controlCopy.confirm.delete,
      },
      hide: {
        title: controlCopy.bulk.confirmHide(n),
        body: controlCopy.confirm.hideBody,
        label: controlCopy.bulk.hide,
      },
      show: {
        title: controlCopy.bulk.confirmShow(n),
        body: controlCopy.confirm.showBody,
        label: controlCopy.bulk.show,
      },
    }[confirm.action];
  })();

  return (
    <div className="flex flex-col gap-4">
      <PhotoFilters value={filters} onChange={setFilters} />

      <div className="flex items-center gap-2">
        <p className="flex-1 text-sm text-ink-subtle tabular-nums" aria-live="polite">
          {library.loading ? "" : copy.count(photos.length, library.hasMore)}
        </p>
        {selection.active && (
          <Button variant="ghost" onClick={selection.selectAll} disabled={library.bulk !== null}>
            {controlCopy.bulk.selectAll}
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={library.refresh}
          aria-label={copy.refresh}
          disabled={library.refreshing}
        >
          <RefreshCw
            aria-hidden
            className={cn("size-4", library.refreshing && "animate-spin")}
            strokeWidth={2}
          />
        </Button>
        <Button
          variant={selection.active ? "primary" : "secondary"}
          onClick={selection.active ? selection.stop : selection.start}
          aria-pressed={selection.active}
          disabled={library.bulk !== null || photos.length === 0}
        >
          <CheckSquare aria-hidden className="size-4" strokeWidth={2} />
          {selection.active ? copy.done : copy.select}
        </Button>
      </div>

      {library.failed ? (
        <PhotosMessage
          tone="error"
          message={copy.loadFailed}
          action={{ label: copy.retry, run: library.retry }}
        />
      ) : library.loading && photos.length === 0 ? (
        <PhotoGridSkeleton />
      ) : photos.length === 0 ? (
        <PhotosMessage
          tone="empty"
          message={filtered ? copy.emptyFiltered : copy.empty}
          action={
            filtered
              ? { label: copy.clearFilters, run: () => setFilters(INITIAL_FILTERS) }
              : undefined
          }
        />
      ) : (
        <ul
          aria-busy={library.loading}
          className={cn(
            "grid grid-cols-2 gap-3 transition-opacity sm:grid-cols-3",
            library.loading && "opacity-50",
          )}
        >
          {photos.map((photo) => (
            <PhotoTile
              key={photo.id}
              photo={photo}
              selecting={selection.active}
              selected={selection.isSelected(photo.id)}
              busy={library.busy.has(photo.id)}
              onOpen={() => setOpenId(photo.id)}
              onToggle={() => selection.toggle(photo.id)}
            />
          ))}
        </ul>
      )}

      {library.hasMore && (
        <div ref={sentinel} className="flex justify-center">
          <Button
            variant="secondary"
            onClick={() => void library.loadMore()}
            disabled={library.loadingMore}
          >
            {library.loadingMore ? copy.loadingMore : copy.loadMore}
          </Button>
        </div>
      )}

      {selection.active && (
        <BulkBar
          count={selection.selected.length}
          progress={library.bulk}
          onAction={(action) => setConfirm({ kind: "bulk", action })}
        />
      )}

      <PhotoSheet
        photo={open}
        busy={open !== null && library.busy.has(open.id)}
        onClose={() => setOpenId(null)}
        onOpenLarge={() => setLarge(open)}
        onSave={(edit) => (open ? library.edit(open, edit) : Promise.resolve(false))}
        onApprove={() => open && void library.approve(open)}
        onSetHidden={(hidden) => open && void library.setHidden(open, hidden)}
        onDelete={() => open && setConfirm({ kind: "delete", photo: open })}
      />
      <Lightbox photo={large} onClose={() => setLarge(null)} />
      <ConfirmDialog
        open={confirm !== null}
        title={confirmCopy.title}
        body={confirmCopy.body}
        confirmLabel={confirmCopy.label}
        danger={
          confirm?.kind === "delete" || (confirm?.kind === "bulk" && confirm.action === "delete")
        }
        onCancel={() => setConfirm(null)}
        onConfirm={() => void runConfirmed()}
      />
    </div>
  );
}
