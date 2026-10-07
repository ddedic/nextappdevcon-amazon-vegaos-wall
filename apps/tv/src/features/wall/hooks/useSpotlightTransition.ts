import { useEffect, useRef, useState } from "react";
import { Animated, Easing } from "react-native";

import type { PlacedPhoto } from "@/features/wall/constants/layout";

const OPEN_MS = 420;
const CLOSE_MS = 380;

/** 0 = card on its wall slot, 1 = open. The last photo stays until the close finishes. */
export function useSpotlightTransition(selection: PlacedPhoto | null) {
  const progress = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(selection);
  if (selection && selection.photo.id !== shown?.photo.id) {
    setShown(selection);
  }

  const open = selection !== null;
  useEffect(() => {
    const run = Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: open ? OPEN_MS : CLOSE_MS,
      easing: open ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    });
    run.start(({ finished }) => {
      if (finished && !open) setShown(null);
    });
    return () => run.stop();
  }, [open, progress]);

  return { progress, shown };
}
