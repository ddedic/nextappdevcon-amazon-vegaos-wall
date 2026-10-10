import { EVENT } from "@boothwall/shared";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { color, fontSize, space, tracking } from "../../../../theme/tokens";

/** "20 / 26" on two lines, the same height as the logo beside it, split by a brand rule. */
export function YearMark() {
  if (!EVENT.year) return null;
  const [top, bottom] = [EVENT.year.slice(0, 2), EVENT.year.slice(2)];
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
    letterSpacing: tracking.mark,
    lineHeight: LINE,
    textAlign: "center",
  },
  accent: {
    color: color.brandPrimaryText,
  },
  rule: {
    backgroundColor: color.brandPrimary,
    height: 1,
    marginVertical: 1,
    width: "100%",
  },
});
