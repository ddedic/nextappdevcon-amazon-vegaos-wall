import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { wallCopy } from "@/features/wall/constants/copy";
import { color, fontSize, radius, space } from "@/theme/tokens";

export function DemoChip() {
  return (
    <View style={styles.chip} testID="demo-chip">
      <Text style={styles.label}>{wallCopy.author.kicker}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: color.brandPink,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm + 2,
    paddingVertical: space.xs,
  },
  label: {
    color: color.textOnFocus,
    fontSize: fontSize.caption - 1,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
});
