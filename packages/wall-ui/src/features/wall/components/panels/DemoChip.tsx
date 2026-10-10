import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { color, fontSize, radius, space, tracking } from "../../../../theme/tokens";
import { wallCopy } from "../../constants/copy";

export function DemoChip() {
  return (
    <View style={styles.chip} testID="demo-chip">
      <Text style={styles.label}>{wallCopy.author.kicker}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: color.brandPrimary,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm + 2,
    paddingVertical: space.xs,
  },
  label: {
    color: color.onBrandPrimary,
    fontSize: fontSize.caption - 1,
    fontWeight: "800",
    letterSpacing: tracking.label,
    textTransform: "uppercase",
  },
});
