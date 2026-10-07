import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { color, fontSize, radius, space } from "@/theme/tokens";

export type StatusPillProps = {
  tone: "pending" | "success" | "danger";
  label: string;
};

const toneColor = { pending: color.warning, success: color.success, danger: color.danger };

/** Status is conveyed by the label text; the dot is reinforcement only. */
export function StatusPill({ tone, label }: StatusPillProps) {
  return (
    <View style={styles.pill} accessibilityRole="text" testID="status-pill">
      <View style={[styles.dot, { backgroundColor: toneColor[tone] }]} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignItems: "center",
    backgroundColor: color.surface,
    borderColor: color.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: space.sm,
    paddingHorizontal: space.md - space.xs,
    paddingVertical: space.xs + 2,
  },
  dot: {
    borderRadius: radius.pill,
    height: space.sm,
    width: space.sm,
  },
  label: {
    color: color.textSecondary,
    fontSize: fontSize.caption,
    fontWeight: "600",
  },
});
