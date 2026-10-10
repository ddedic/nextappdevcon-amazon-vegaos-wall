import React, { memo, useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text } from "react-native";

import { color, fontSize, radius, space } from "../../../../theme/tokens";
import { wallCopy } from "../../constants/copy";
import { NATIVE_DRIVER } from "../../constants/motion";

export type ExitHintProps = { visible: boolean };

/** "Press Back again to exit", centred so nobody misses it. */
export const ExitHint = memo(function ExitHint({ visible }: ExitHintProps) {
  const show = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(show, {
      toValue: visible ? 1 : 0,
      duration: visible ? 180 : 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  }, [show, visible]);

  const style = {
    opacity: show,
    transform: [{ scale: show.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }],
  };

  return (
    <Animated.View style={[styles.wrap, style]} pointerEvents="none">
      <Text style={styles.text}>
        {wallCopy.exitHint.before}
        <Text style={styles.key}>{wallCopy.exitHint.key}</Text>
        {wallCopy.exitHint.after}
      </Text>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "center",
    backgroundColor: color.canvas,
    borderColor: color.brandPrimary,
    borderRadius: radius.pill,
    borderWidth: 2,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm + 2,
    position: "absolute",
    top: "45%",
    zIndex: 110,
  },
  text: {
    color: color.textPrimary,
    fontSize: fontSize.lead,
    fontWeight: "700",
  },
  key: {
    color: color.brandPrimaryText,
    fontWeight: "900",
  },
});
