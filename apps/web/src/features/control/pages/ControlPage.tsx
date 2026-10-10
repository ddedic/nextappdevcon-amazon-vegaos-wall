import { Lock } from "lucide-react";
import { useState } from "react";

import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { OverviewPanel } from "@/features/control/components/overview/OverviewPanel";
import { PhotosPanel } from "@/features/control/components/photos/PhotosPanel";
import { QueuePanel } from "@/features/control/components/queue/QueuePanel";
import { RemotePad } from "@/features/control/components/remote/RemotePad";
import { ControlTabs, panelId, tabId } from "@/features/control/components/shell/ControlTabs";
import { ToastHost } from "@/features/control/components/shell/ToastHost";
import { UnlockForm } from "@/features/control/components/shell/UnlockForm";
import { controlCopy } from "@/features/control/constants/copy";
import { CONTROL_TABS, type ControlTab } from "@/features/control/constants/tabs";
import { sendRemoteCommand } from "@/features/control/data/controlApi";
import { useControlSession } from "@/features/control/hooks/useControlSession";
import { useQueue } from "@/features/control/hooks/useQueue";

/** The tab lives in the hash, so a reload or a shared link opens the same one. */
const tabFromHash = (): ControlTab =>
  CONTROL_TABS.find((tab) => `#${tab}` === window.location.hash) ?? "queue";

/** The booth's Control panel (/control, not linked anywhere), unlocked with a passcode. */
export function ControlPage() {
  const { passcode, setPasscode, error, setError, toast, dismissToast, session } =
    useControlSession();
  const queue = useQueue(session, setError);
  const [tab, setTabState] = useState<ControlTab>(tabFromHash);

  const setTab = (next: ControlTab) => {
    setTabState(next);
    history.replaceState(null, "", next === "queue" ? window.location.pathname : `#${next}`);
  };

  return (
    <PageShell>
      <section className="mt-8 mb-5 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">{controlCopy.title}</h1>
        {passcode && (
          <Button variant="ghost" onClick={() => setPasscode("")} aria-label={controlCopy.lock}>
            <Lock aria-hidden className="size-4" strokeWidth={1.8} />
          </Button>
        )}
      </section>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-control border border-primary/40 bg-primary/10 p-3 text-sm"
        >
          {error}
        </p>
      )}

      {!passcode ? (
        <UnlockForm onUnlock={setPasscode} />
      ) : (
        <>
          <ControlTabs current={tab} onChange={setTab} waiting={queue.pending.length} />
          <div
            key={tab}
            id={panelId(tab)}
            role="tabpanel"
            aria-labelledby={tabId(tab)}
            className="animate-rise-in"
          >
            {tab === "queue" && <QueuePanel queue={queue} />}
            {tab === "photos" && <PhotosPanel session={session} />}
            {tab === "remote" && (
              <RemotePad
                onPress={(command) =>
                  void sendRemoteCommand(command, passcode).catch((err: unknown) => {
                    if (!session.fail(err)) session.notify(controlCopy.toast.failed);
                  })
                }
              />
            )}
            {tab === "overview" && <OverviewPanel session={session} />}
          </div>
        </>
      )}
      <ToastHost toast={toast} onDismiss={dismissToast} />
    </PageShell>
  );
}
