import { Camera, Images } from "lucide-react";
import { type ChangeEvent, useRef } from "react";

import { Button } from "@/components/ui/Button";
import { captureCopy } from "@/features/capture/constants/copy";

export type PhotoPickerProps = {
  onPick: (file: File) => void;
  busy: boolean;
};

export function PhotoPicker({ onPick, busy }: PhotoPickerProps) {
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) onPick(file);
  };

  return (
    <div className="flex flex-col gap-3">
      <Button
        variant="brand"
        size="lg"
        disabled={busy}
        onClick={() => cameraInput.current?.click()}
      >
        <Camera aria-hidden className="size-5" strokeWidth={1.8} />
        {busy ? captureCopy.preparing : captureCopy.takePhoto}
      </Button>
      <Button
        variant="secondary"
        size="lg"
        disabled={busy}
        onClick={() => galleryInput.current?.click()}
      >
        <Images aria-hidden className="size-5" strokeWidth={1.8} />
        {captureCopy.pickPhoto}
      </Button>
      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="user"
        hidden
        onChange={handleChange}
        data-testid="camera-input"
      />
      <input
        ref={galleryInput}
        type="file"
        accept="image/*"
        hidden
        onChange={handleChange}
        data-testid="gallery-input"
      />
    </div>
  );
}
