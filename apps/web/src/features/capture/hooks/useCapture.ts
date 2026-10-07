import type { PhotoDTO, Tribe } from "@vegaos-demo/shared";
import { useCallback, useEffect, useState } from "react";

import { captureCopy } from "@/features/capture/constants/copy";
import { myPhotos } from "@/features/capture/data/myPhotos";
import { removeOwnPhoto, uploadPhoto } from "@/features/capture/data/uploadPhoto";
import { ApiError } from "@/lib/api";
import { resizeImage } from "@/lib/resizeImage";

type Draft = { image: Blob; previewUrl: string };
type Posted = { photo: PhotoDTO; deleteToken: string; previewUrl: string };

export type CaptureStep = "pick" | "compose" | "sending" | "done" | "removed";

const messageFor = (error: unknown): string => {
  if (error instanceof ApiError && error.code in captureCopy.errors) {
    return captureCopy.errors[error.code as keyof typeof captureCopy.errors];
  }
  return captureCopy.errors.generic;
};

export function useCapture() {
  const [step, setStep] = useState<CaptureStep>("pick");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [posted, setPosted] = useState<Posted | null>(null);
  const [caption, setCaption] = useState("");
  const [tribe, setTribe] = useState<Tribe | null>(null);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!draft) return;
    return () => URL.revokeObjectURL(draft.previewUrl);
  }, [draft]);

  const pickFile = useCallback(async (file: File) => {
    setError(null);
    setBusy(true);
    try {
      const image = await resizeImage(file);
      setDraft({ image, previewUrl: URL.createObjectURL(image) });
      setStep("compose");
    } catch {
      setError(captureCopy.errors.DECODE);
    } finally {
      setBusy(false);
    }
  }, []);

  const submit = useCallback(async () => {
    if (!draft || !tribe || !consent) return;
    setError(null);
    setStep("sending");
    try {
      const { photo, deleteToken } = await uploadPhoto({ image: draft.image, caption, tribe });
      myPhotos.remember({ id: photo.id, deleteToken });
      setPosted({ photo, deleteToken, previewUrl: draft.previewUrl });
      setStep("done");
    } catch (err) {
      setError(messageFor(err));
      setStep("compose");
    }
  }, [caption, consent, draft, tribe]);

  const removePosted = useCallback(async () => {
    if (!posted) return;
    setBusy(true);
    try {
      await removeOwnPhoto(posted.photo.id, posted.deleteToken);
      myPhotos.forget(posted.photo.id);
      setStep("removed");
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy(false);
    }
  }, [posted]);

  const reset = useCallback(() => {
    setDraft(null);
    setPosted(null);
    setCaption("");
    setError(null);
    setStep("pick");
  }, []);

  return {
    step,
    draft,
    posted,
    caption,
    setCaption,
    tribe,
    setTribe,
    consent,
    setConsent,
    error,
    busy,
    canSubmit: Boolean(draft && tribe && consent),
    pickFile,
    submit,
    removePosted,
    reset,
  };
}
