import type { PhotoDTO, RemoteCommand } from "@vegaos-demo/shared";
import { useCallback, useEffect, useState } from "react";

import { adminCopy } from "@/features/admin/constants/copy";
import {
  approvePhoto,
  fetchApproved,
  fetchPending,
  removePhoto,
  sendRemoteCommand,
} from "@/features/admin/data/adminWall";
import { ApiError } from "@/lib/api";

const PASSCODE_KEY = "live-wall:passcode";
const REFRESH_MS = 4000;

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

export function useAdminWall() {
  const [passcode, setPasscodeState] = useState(storage.read);
  const [pending, setPending] = useState<PhotoDTO[]>([]);
  const [approved, setApproved] = useState<PhotoDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const setPasscode = useCallback((value: string) => {
    storage.write(value);
    setPasscodeState(value);
  }, []);

  const handleError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 403) {
        setPasscode("");
        setError(adminCopy.badPasscode);
      } else if (err instanceof ApiError && err.status === 429) {
        setPasscode("");
        setError(adminCopy.locked);
      } else {
        setError(adminCopy.loadFailed);
      }
    },
    [setPasscode],
  );

  const refresh = useCallback(async () => {
    if (!passcode) return;
    try {
      const [waiting, wall] = await Promise.all([fetchPending(passcode), fetchApproved()]);
      setPending(waiting);
      setApproved(wall.photos);
      setError(null);
    } catch (err) {
      handleError(err);
    }
  }, [handleError, passcode]);

  useEffect(() => {
    if (!passcode) return;
    void refresh();
    const timer = setInterval(() => void refresh(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [passcode, refresh]);

  const act = useCallback(
    async (id: string, action: (id: string, passcode: string) => Promise<void>) => {
      setBusyId(id);
      try {
        await action(id, passcode);
        await refresh();
      } catch (err) {
        handleError(err);
      } finally {
        setBusyId(null);
      }
    },
    [handleError, passcode, refresh],
  );

  return {
    passcode,
    setPasscode,
    pending,
    approved,
    error,
    busyId,
    approve: (id: string) => act(id, approvePhoto),
    remove: (id: string) => act(id, removePhoto),
    press: (command: RemoteCommand) =>
      sendRemoteCommand(command, passcode).catch((err: unknown) => handleError(err)),
  };
}
