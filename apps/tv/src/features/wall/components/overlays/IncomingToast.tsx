import { type PhotoDTO, TRIBES } from "@vegaos-demo/shared";
import React, { memo, useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

import { wallCopy } from "@/features/wall/constants/copy";
import { CANVAS_HEIGHT, NOW_BAR } from "@/features/wall/constants/layout";
import { color, fontSize, radius, space } from "@/theme/tokens";

export type IncomingToastProps = {
  photo: PhotoDTO | null;
};

export const IncomingToast = memo(function IncomingToast({ photo }: IncomingToastProps) {
  const show = useRef(new Animated.Value(0)).current;
  const visible = photo !== null;

  useEffect(() => {
    Animated.timing(show, {
      toValue: visible ? 1 : 0,
      duration: visible ? 320 : 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [show, visible]);

  const style = useMemo(
    () => ({
      opacity: show,
      transform: [{ translateY: show.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
    }),
    [show],
  );

  return (
    <Animated.View style={[styles.toast, style]} pointerEvents="none">
      <View style={styles.dot} />
      <Text style={styles.text}>
        <Text style={styles.strong}>{wallCopy.incoming.title}</Text>
        {photo ? `  ·  ${TRIBES[photo.tribe]}  ·  ${wallCopy.incoming.upNext}` : ""}
      </Text>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  toast: {
    alignItems: "center",
    backgroundColor: color.canvas,
    borderColor: color.brandPink,
    borderRadius: radius.pill,
    borderWidth: 1,
    bottom: CANVAS_HEIGHT - NOW_BAR.top + space.sm,
    flexDirection: "row",
    gap: space.sm,
    left: NOW_BAR.left,
    paddingHorizontal: space.md,
    paddingVertical: space.xs + 2,
    position: "absolute",
    zIndex: 70,
  },
  dot: {
    backgroundColor: color.brandPink,
    borderRadius: radius.pill,
    height: space.sm,
    width: space.sm,
  },
  text: {
    color: color.textSecondary,
    fontSize: fontSize.caption,
    fontWeight: "600",
  },
  strong: {
    color: color.textPrimary,
    fontWeight: "800",
  },
});
