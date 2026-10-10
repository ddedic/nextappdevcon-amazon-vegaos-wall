import React, { type ReactNode } from "react";
import { Animated, type StyleProp, StyleSheet, type ViewStyle } from "react-native";

import { size } from "../../../../theme/tokens";

export type TiltedSurfaceProps = {
  style: StyleProp<Animated.WithAnimatedValue<ViewStyle>>;
  children: ReactNode;
  pointerEvents?: "none" | "auto";
};

/**
 * Every rotated card goes through this. Vega draws a rotated view with hard, stair-stepped
 * edges. Drawing it into a texture and rotating the texture filters the edges, but only if the
 * visible edge sits inside the texture: hence the transparent inset, cancelled by a negative
 * margin so layout doesn't move. The texture also makes moving the card cheaper.
 */
export function TiltedSurface({ style, children, pointerEvents }: TiltedSurfaceProps) {
  return (
    <Animated.View style={style} pointerEvents={pointerEvents} renderToHardwareTextureAndroid>
      <Animated.View style={styles.inset}>{children}</Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  inset: {
    margin: -size.tiltInset,
    padding: size.tiltInset,
  },
});
