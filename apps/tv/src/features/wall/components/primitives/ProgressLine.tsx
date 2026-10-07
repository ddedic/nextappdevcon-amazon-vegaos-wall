import React, { memo, useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

import { color, radius } from "@/theme/tokens";

export type ProgressLineProps = {
  width: number;
  durationMs: number;
  cycleKey: string;
  paused: boolean;
};

export const ProgressLine = memo(function ProgressLine({
  width,
  durationMs,
  cycleKey,
  paused,
}: ProgressLineProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const lastCycle = useRef(cycleKey);

  useEffect(() => {
    // New cycle: start from empty. Same cycle with a new duration (a "hurry"):
    // carry on from the current fill, just faster.
    if (lastCycle.current !== cycleKey) {
      lastCycle.current = cycleKey;
      progress.setValue(0);
    }
    if (paused) return;
    const run = Animated.timing(progress, {
      toValue: 1,
      duration: durationMs,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    run.start();
    return () => run.stop();
  }, [cycleKey, durationMs, paused, progress]);

  const fillStyle = useMemo(
    () => ({
      width,
      transform: [
        { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [-width, 0] }) },
      ],
    }),
    [progress, width],
  );

  return (
    <View style={[styles.track, { width }]}>
      <Animated.View style={[styles.fill, fillStyle]} />
    </View>
  );
});

const styles = StyleSheet.create({
  track: {
    backgroundColor: color.surfaceFocused,
    borderRadius: radius.pill,
    height: 3,
    overflow: "hidden",
  },
  fill: {
    backgroundColor: color.brandPink,
    height: 3,
  },
});
