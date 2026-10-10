import type { RemoteCommand } from "@boothwall/shared";
import { useCallback, useEffect, useRef, useState } from "react";

import { EXIT_CONFIRM_MS } from "../constants/timing";
import { exitApp, useBackButton } from "./useBackButton";
import type { RemoteCommands } from "./useWallDirector";

export type RemoteHandlers = Partial<Record<RemoteCommand, () => void>>;

/**
 * The platform's remote, supplied by the app shell: the TV remote on Vega, the keyboard on the
 * web. It calls the matching handler once per press.
 */
export type RemoteInputHook = (handlers: RemoteHandlers) => void;

/**
 * Booth kiosk: Back closes the spotlight first. On the wall it takes a second press within
 * EXIT_CONFIRM_MS to exit, so a visitor bumping the remote can't close the booth screen.
 */
export function useWallRemote(
  commands: RemoteCommands,
  spotlight: boolean,
  useRemoteInput: RemoteInputHook,
) {
  useRemoteInput(commands);
  const [exitArmed, setExitArmed] = useState(false);
  const armedAt = useRef(0);
  const spotlightRef = useRef(spotlight);
  spotlightRef.current = spotlight;

  const onBack = useCallback(() => {
    if (spotlightRef.current) {
      commands.back();
      return true;
    }
    const now = Date.now();
    if (now - armedAt.current < EXIT_CONFIRM_MS) {
      exitApp();
      return true;
    }
    armedAt.current = now;
    setExitArmed(true);
    return true;
  }, [commands]);

  useBackButton(onBack);

  useEffect(() => {
    if (!exitArmed) return;
    const timer = setTimeout(() => setExitArmed(false), EXIT_CONFIRM_MS);
    return () => clearTimeout(timer);
  }, [exitArmed]);

  return { exitArmed };
}
