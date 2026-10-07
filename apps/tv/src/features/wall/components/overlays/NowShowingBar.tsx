import { type PhotoDTO, TRIBES } from "@vegaos-demo/shared";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { ProgressLine } from "@/features/wall/components/primitives/ProgressLine";
import { wallCopy } from "@/features/wall/constants/copy";
import { NOW_BAR } from "@/features/wall/constants/layout";
import { formatRelative } from "@/features/wall/utils/formatRelative";
import { color, fontSize, radius, space } from "@/theme/tokens";

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

  return (
    <View style={styles.bar}>
      <View style={styles.row}>
        <View style={styles.text}>
          <Text style={styles.caption} numberOfLines={1}>
            {photo.caption ?? wallCopy.noCaption}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            <Text style={styles.hashtag}>{wallCopy.hashtag}</Text>
            {`  ·  ${TRIBES[photo.tribe]}  ·  ${formatRelative(photo.createdAt)}`}
          </Text>
        </View>
        <View style={styles.side}>
          <Text style={styles.label}>{paused ? wallCopy.paused : wallCopy.nowShowing}</Text>
          <Text style={styles.position}>{wallCopy.position(position, total)}</Text>
        </View>
      </View>
      <View style={styles.track}>
        <ProgressLine
          width={NOW_BAR.width}
          durationMs={durationMs}
          cycleKey={cycleKey}
          paused={paused}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: color.surface,
    borderColor: color.border,
    borderRadius: radius.card,
    borderWidth: 1,
    height: NOW_BAR.height,
    left: NOW_BAR.left,
    overflow: "hidden",
    position: "absolute",
    top: NOW_BAR.top,
    width: NOW_BAR.width,
    zIndex: 45,
  },
  row: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: space.md,
    paddingHorizontal: space.md,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  caption: {
    color: color.textPrimary,
    fontSize: fontSize.body + 1,
    fontWeight: "800",
  },
  meta: {
    color: color.textSecondary,
    fontSize: fontSize.caption,
    fontWeight: "600",
  },
  hashtag: {
    color: color.brandPink,
    fontWeight: "800",
  },
  side: {
    alignItems: "flex-end",
    gap: 2,
  },
  label: {
    color: color.textMuted,
    fontSize: fontSize.caption - 1,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  position: {
    color: color.textPrimary,
    fontSize: fontSize.caption + 1,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
  },
  track: {
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
