import { useCallback, useEffect, useRef, useState } from "react";

import { controlCopy } from "@/features/control/constants/copy";
import { TOAST_MS } from "@/features/control/constants/timing";
import { ApiError } from "@/lib/api";

const PASSCODE_KEY = "boothwall:passcode";

const storage = {
  read: () => {
    try {
      return sessionStorage.getItem(PASSCODE_KEY) ?? "";
    } catch {
      return "";
    }
  },
  write: (value: string) => {
    try {
      if (value) sessionStorage.setItem(PASSCODE_KEY, value);
      else sessionStorage.removeItem(PASSCODE_KEY);
    } catch {
      // In-memory only when sessionStorage is unavailable.
    }
  },
};

export type Toast = {
  id: number;
  message: string;
  /** An optional follow-up, such as Undo. */
  action?: { label: string; run: () => void };
};

export type ControlSession = {
  passcode: string;
  /** Locks the panel on a wrong passcode or a lockout; true when it did. */
  fail: (err: unknown) => boolean;
  notify: (message: string, action?: Toast["action"]) => void;
};

/** The passcode (kept for the tab only), the page-wide error and the toast. */
export function useControlSession() {
  const [passcode, setPasscodeState] = useState(storage.read);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const setPasscode = useCallback((value: string) => {
    storage.write(value);
    setPasscodeState(value);
    if (value) setError(null);
  }, []);

  const fail = useCallback(
    (err: unknown) => {
      if (!(err instanceof ApiError) || (err.status !== 403 && err.status !== 429)) return false;
      setPasscode("");
      setError(err.status === 403 ? controlCopy.badPasscode : controlCopy.locked);
      return true;
    },
    [setPasscode],
  );

  const dismissToast = useCallback(() => {
    clearTimeout(toastTimer.current);
    setToast(null);
  }, []);

  const notify = useCallback((message: string, action?: Toast["action"]) => {
    clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), message, action });
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  return {
    passcode,
    setPasscode,
    error,
    setError,
    toast,
    dismissToast,
    session: { passcode, fail, notify } satisfies ControlSession,
  };
}
