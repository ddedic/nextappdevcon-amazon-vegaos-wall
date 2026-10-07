import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { wallCopy } from "@/features/wall/constants/copy";
import { color, fontSize, space } from "@/theme/tokens";

/** "20 / 26" on two lines, the same height as the logo beside it, split by a pink rule. */
export function YearMark() {
  const [top, bottom] = wallCopy.year;
  return (
    <View style={styles.mark} accessibilityLabel={`${top}${bottom}`}>
      <Text style={styles.digits}>{top}</Text>
      <View style={styles.rule} />
      <Text style={[styles.digits, styles.accent]}>{bottom}</Text>
    </View>
  );
}

const LINE = fontSize.body + 1;

const styles = StyleSheet.create({
  mark: {
    alignItems: "center",
    marginLeft: -space.xs,
  },
  digits: {
    color: color.textPrimary,
    fontSize: fontSize.body,
    fontWeight: "900",
    letterSpacing: 2,
    lineHeight: LINE,
    textAlign: "center",
  },
  accent: {
    color: color.brandPink,
  },
  rule: {
    backgroundColor: color.brandPink,
    height: 1,
    marginVertical: 1,
    width: "100%",
  },
});
