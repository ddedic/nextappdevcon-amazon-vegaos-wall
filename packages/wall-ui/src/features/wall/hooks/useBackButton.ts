import { useEffect } from "react";
import { BackHandler } from "react-native";

/** The remote's Back button. `onBack` returns true when it handled the press. */
export function useBackButton(onBack: () => boolean) {
  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", onBack);
    return () => subscription.remove();
  }, [onBack]);
}

export const exitApp = () => BackHandler.exitApp();
