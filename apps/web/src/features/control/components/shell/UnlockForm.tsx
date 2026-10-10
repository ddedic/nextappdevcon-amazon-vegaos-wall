import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/Button";
import { controlCopy } from "@/features/control/constants/copy";

export type UnlockFormProps = {
  onUnlock: (passcode: string) => void;
};

export function UnlockForm({ onUnlock }: UnlockFormProps) {
  const [draft, setDraft] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onUnlock(draft.trim());
    setDraft("");
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-2 text-sm font-medium text-ink-muted">
        {controlCopy.passcodeLabel}
        <input
          type="password"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="h-14 rounded-control border border-line bg-surface px-4 text-center text-2xl tracking-code text-ink focus:border-ink focus:outline-none"
        />
      </label>
      <Button type="submit" variant="primary" size="lg" disabled={!draft.trim()}>
        {controlCopy.unlock}
      </Button>
    </form>
  );
}
