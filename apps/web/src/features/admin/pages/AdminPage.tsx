import { type PhotoDTO, TRIBES } from "@vegaos-demo/shared";
import { Check, Lock, X } from "lucide-react";
import { type FormEvent, useState } from "react";

import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { RemotePad } from "@/features/admin/components/RemotePad";
import { adminCopy } from "@/features/admin/constants/copy";
import { useAdminWall } from "@/features/admin/hooks/useAdminWall";
import { cn } from "@/lib/cn";

type Tab = "pending" | "approved" | "remote";

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/** Hidden booth page (/admin, not linked anywhere), unlocked with a passcode. */
export function AdminPage() {
  const admin = useAdminWall();
  const [tab, setTab] = useState<Tab>("pending");
  const [draft, setDraft] = useState("");

  const unlock = (event: FormEvent) => {
    event.preventDefault();
    admin.setPasscode(draft.trim());
    setDraft("");
  };

  const photos = tab === "approved" ? admin.approved : admin.pending;

  return (
    <PageShell>
      <section className="mt-10 mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">{adminCopy.title}</h1>
        {admin.passcode && (
          <Button variant="ghost" onClick={() => admin.setPasscode("")} aria-label={adminCopy.lock}>
            <Lock aria-hidden className="size-4" strokeWidth={1.8} />
          </Button>
        )}
      </section>

      {admin.error && (
        <p
          role="alert"
          className="mb-4 rounded-control border border-pink/40 bg-pink/10 p-3 text-sm"
        >
          {admin.error}
        </p>
      )}

      {!admin.passcode ? (
        <form onSubmit={unlock} className="flex flex-col gap-3">
          <label className="flex flex-col gap-2 text-sm font-medium text-ink-muted">
            {adminCopy.passcodeLabel}
            <input
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="h-14 rounded-control border border-line bg-surface px-4 text-center text-2xl tracking-[0.5em] text-ink focus:border-ink focus:outline-none"
            />
          </label>
          <Button type="submit" variant="primary" size="lg" disabled={!draft.trim()}>
            {adminCopy.unlock}
          </Button>
        </form>
      ) : (
        <>
          <div
            role="tablist"
            className="mb-4 grid grid-cols-3 gap-1 rounded-control border border-line bg-surface p-1"
          >
            {(["pending", "approved", "remote"] as const).map((id) => {
              const count =
                id === "pending"
                  ? admin.pending.length
                  : id === "approved"
                    ? admin.approved.length
                    : null;
              return (
                <button
                  key={id}
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => setTab(id)}
                  className={cn(
                    "flex h-10 items-center justify-center gap-2 rounded-control text-sm font-semibold transition",
                    tab === id ? "bg-ink text-ink-inverse" : "text-ink-muted",
                  )}
                >
                  {adminCopy.tabs[id]}
                  {count !== null && (
                    <span
                      className={cn(
                        "rounded-pill px-2 text-xs tabular-nums",
                        id === "pending" && count > 0
                          ? "bg-pink text-ink-inverse"
                          : "bg-surface-strong",
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {tab === "remote" && <RemotePad onPress={(command) => void admin.press(command)} />}

          {tab !== "remote" && photos.length === 0 && (
            <p className="py-10 text-center text-ink-muted">
              {tab === "pending" ? adminCopy.emptyPending : adminCopy.emptyApproved}
            </p>
          )}

          <ul className="flex flex-col gap-4">
            {(tab === "remote" ? [] : photos).map((photo) => (
              <AdminPhotoCard
                key={photo.id}
                photo={photo}
                busy={admin.busyId === photo.id}
                onApprove={tab === "pending" ? () => void admin.approve(photo.id) : undefined}
                onRemove={() => {
                  if (tab === "pending" || window.confirm(adminCopy.confirmRemove))
                    void admin.remove(photo.id);
                }}
                removeLabel={tab === "pending" ? adminCopy.reject : adminCopy.remove}
              />
            ))}
          </ul>
        </>
      )}
    </PageShell>
  );
}

type AdminPhotoCardProps = {
  photo: PhotoDTO;
  busy: boolean;
  onApprove?: () => void;
  onRemove: () => void;
  removeLabel: string;
};

function AdminPhotoCard({ photo, busy, onApprove, onRemove, removeLabel }: AdminPhotoCardProps) {
  return (
    <li className="overflow-hidden rounded-card border border-line bg-surface">
      <img
        src={photo.imageUrl}
        alt={photo.caption ?? "Submitted photo"}
        className="aspect-square w-full object-cover"
      />
      <div className="flex flex-col gap-3 p-4">
        <div>
          <p className="font-medium">{photo.caption ?? "No caption"}</p>
          <p className="text-sm text-ink-subtle">
            {TRIBES[photo.tribe]} · {time(photo.createdAt)}
          </p>
        </div>
        <div className={cn("grid gap-2", onApprove ? "grid-cols-2" : "grid-cols-1")}>
          <Button variant="danger" onClick={onRemove} disabled={busy}>
            <X aria-hidden className="size-4" strokeWidth={1.8} />
            {removeLabel}
          </Button>
          {onApprove && (
            <Button variant="primary" onClick={onApprove} disabled={busy}>
              <Check aria-hidden className="size-4" strokeWidth={2.2} />
              {adminCopy.approve}
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}
