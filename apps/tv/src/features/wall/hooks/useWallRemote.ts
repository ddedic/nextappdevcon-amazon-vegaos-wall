import { useCallback, useEffect, useRef, useState } from "react";
import { BackHandler } from "react-native";

import { EXIT_CONFIRM_MS } from "@/features/wall/constants/timing";

import { useRemoteControl } from "./useRemoteControl";
import type { RemoteCommands } from "./useWallDirector";

/**
 * Booth kiosk: Back closes the spotlight first. On the wall it takes a second press within
 * EXIT_CONFIRM_MS to exit, so a visitor bumping the remote can't close the booth screen.
 */
export function useWallRemote(commands: RemoteCommands, spotlight: boolean) {
  useRemoteControl(commands);
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
      BackHandler.exitApp();
      return true;
    }
    armedAt.current = now;
    setExitArmed(true);
    return true;
  }, [commands]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", onBack);
    return () => subscription.remove();
  }, [onBack]);

  useEffect(() => {
    if (!exitArmed) return;
    const timer = setTimeout(() => setExitArmed(false), EXIT_CONFIRM_MS);
    return () => clearTimeout(timer);
  }, [exitArmed]);

  return { exitArmed };
}
