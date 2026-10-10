import React, { memo, useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

import { color, radius, size } from "../../../../theme/tokens";
import { NATIVE_DRIVER } from "../../constants/motion";

export type ProgressLineProps = {
  width: number;
  durationMs: number;
  cycleKey: string;
  paused: boolean;
  /** Line height in dp. */
  thickness?: number;
};

export const ProgressLine = memo(function ProgressLine({
  width,
  durationMs,
  cycleKey,
  paused,
  thickness = size.barTrack,
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
      useNativeDriver: NATIVE_DRIVER,
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
    <View style={[styles.track, { width, height: thickness }]}>
      <Animated.View style={[styles.fill, { height: thickness }, fillStyle]} />
    </View>
  );
});

const styles = StyleSheet.create({
  track: {
    backgroundColor: color.surfaceFocused,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  fill: {
    backgroundColor: color.brandPrimary,
  },
});
