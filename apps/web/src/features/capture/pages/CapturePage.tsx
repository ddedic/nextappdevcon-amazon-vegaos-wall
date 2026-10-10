import { PageShell } from "@/components/layout/PageShell";
import { ComposeForm } from "@/features/capture/components/compose/ComposeForm";
import { PhotoPicker } from "@/features/capture/components/compose/PhotoPicker";
import { SuccessView } from "@/features/capture/components/success/SuccessView";
import { captureCopy } from "@/features/capture/constants/copy";
import { useCapture } from "@/features/capture/hooks/useCapture";

export function CapturePage() {
  const capture = useCapture();
  const { step, draft, posted, error } = capture;

  return (
    <PageShell onHome={capture.reset}>
      {step === "pick" && (
        <section className="mt-14 mb-10">
          <p className="mb-3 text-xs font-bold tracking-eyebrow text-primary-text uppercase">
            {captureCopy.eyebrow}
          </p>
          <h1 className="text-5xl leading-display font-bold tracking-tight">{captureCopy.title}</h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-muted">{captureCopy.intro}</p>
        </section>
      )}
      {step !== "pick" && <div className="h-8" />}

      {error && (
        <p
          role="alert"
          className="mb-5 rounded-control border border-primary/40 bg-primary/10 p-3.5 text-sm text-ink"
        >
          {error}
        </p>
      )}

      {step === "pick" && (
        <ol className="mb-10 flex flex-col gap-3">
          {captureCopy.steps.map((item, index) => (
            <li
              key={item.title}
              className="flex items-center gap-4 rounded-card border border-line bg-surface p-4 backdrop-blur"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-pill bg-primary/15 text-sm font-bold text-primary-text ring-1 ring-primary/30">
                {index + 1}
              </span>
              <span className="flex flex-col">
                <span className="font-semibold">{item.title}</span>
                <span className="text-sm text-ink-muted">{item.body}</span>
              </span>
            </li>
          ))}
        </ol>
      )}

      {step === "pick" && (
        <div className="mt-auto flex flex-col gap-8">
          <PhotoPicker onPick={capture.pickFile} busy={capture.busy} />
        </div>
      )}

      {(step === "compose" || step === "sending") && draft && (
        <ComposeForm
          previewUrl={draft.previewUrl}
          caption={capture.caption}
          onCaptionChange={capture.setCaption}
          tribe={capture.tribe}
          onTribeChange={capture.setTribe}
          consent={capture.consent}
          onConsentChange={capture.setConsent}
          canSubmit={capture.canSubmit}
          sending={step === "sending"}
          onSubmit={capture.submit}
          onRetake={capture.retake}
        />
      )}

      {(step === "done" || step === "removed") && posted && (
        <SuccessView
          previewUrl={posted.previewUrl}
          caption={posted.photo.caption}
          removed={step === "removed"}
          busy={capture.busy}
          onAnother={capture.reset}
          onRemove={capture.removePosted}
        />
      )}
    </PageShell>
  );
}
