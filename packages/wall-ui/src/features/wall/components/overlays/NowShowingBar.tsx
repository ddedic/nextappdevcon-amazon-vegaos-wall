import { CATCH_ALL_TRIBE, type PhotoDTO, TRIBES } from "@boothwall/shared";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { color, fontSize, size, space, tracking } from "../../../../theme/tokens";
import { wallCopy } from "../../constants/copy";
import { NOW_BAR } from "../../constants/layout";
import { formatRelative } from "../../utils/formatRelative";
import { ProgressLine } from "../primitives/ProgressLine";

export type NowShowingBarProps = {
  photo: PhotoDTO | null;
  position: number;
  total: number;
  durationMs: number;
  cycleKey: string;
  paused: boolean;
};

export function NowShowingBar({
  photo,
  position,
  total,
  durationMs,
  cycleKey,
  paused,
}: NowShowingBarProps) {
  if (!photo) return null;
  const meta = [
    photo.tribe === CATCH_ALL_TRIBE ? null : TRIBES[photo.tribe],
    formatRelative(photo.createdAt),
  ]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <View style={styles.bar}>
      <View style={styles.row}>
        <Text style={styles.caption} numberOfLines={1}>
          {photo.caption ?? wallCopy.noCaption}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {meta}
        </Text>
        <Text style={styles.position}>
          {paused && <Text style={styles.label}>{`${wallCopy.paused}  `}</Text>}
          {wallCopy.counter(position, total)}
        </Text>
      </View>
      <ProgressLine
        width={NOW_BAR.width}
        durationMs={durationMs}
        cycleKey={cycleKey}
        paused={paused}
        thickness={size.stripLine}
      />
    </View>
  );
}

// No box: plain text on the dark backdrop with the progress as a thin line under it. Cheaper
// than a translucent bordered panel, and it takes less room from the collage.
const styles = StyleSheet.create({
  bar: {
    gap: space.xs + 2,
    height: NOW_BAR.height,
    justifyContent: "center",
    left: NOW_BAR.left,
    position: "absolute",
    top: NOW_BAR.top,
    width: NOW_BAR.width,
    zIndex: 45,
  },
  row: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: space.sm + 2,
  },
  caption: {
    color: color.textPrimary,
    flexShrink: 1,
    fontSize: fontSize.body - 1,
    fontWeight: "800",
  },
  meta: {
    color: color.textMuted,
    flex: 1,
    fontSize: fontSize.caption,
    fontWeight: "600",
  },
  label: {
    color: color.textMuted,
    fontSize: fontSize.caption - 1,
    fontWeight: "800",
    letterSpacing: tracking.label,
    textTransform: "uppercase",
  },
  position: {
    color: color.textSecondary,
    fontSize: fontSize.caption + 1,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
  },
});
