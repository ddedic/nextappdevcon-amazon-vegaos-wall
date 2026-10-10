import { CATCH_ALL_TRIBE, TRIBES } from "@boothwall/shared";
import React, { memo, useMemo } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { color, fontSize, radius, space, tracking } from "../../../../theme/tokens";
import { wallCopy } from "../../constants/copy";
import { type PlacedPhoto, POLAROID, SPOTLIGHT } from "../../constants/layout";
import { useSpotlightTransition } from "../../hooks/useSpotlightTransition";
import { formatRelative } from "../../utils/formatRelative";
import { ProgressLine } from "../primitives/ProgressLine";
import { SpotlightCards } from "./SpotlightCards";

export type SpotlightProps = {
  /** The photo to show full screen and the wall slot it zooms out of; null closes it. */
  selection: PlacedPhoto | null;
  position: number;
  total: number;
  durationMs: number;
  cycleKey: string;
  paused: boolean;
};

const DETAILS_SHIFT = 16;

export const Spotlight = memo(function Spotlight({
  selection,
  position,
  total,
  durationMs,
  cycleKey,
  paused,
}: SpotlightProps) {
  const { progress, shown } = useSpotlightTransition(selection);

  const animated = useMemo(
    () => ({
      backdrop: { opacity: progress },
      details: {
        opacity: progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] }),
        transform: [
          {
            translateX: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [DETAILS_SHIFT, 0],
            }),
          },
        ],
      },
    }),
    [progress],
  );

  if (!shown) return null;
  const { photo } = shown;

  return (
    <View style={styles.root} pointerEvents="none">
      <Animated.View style={[styles.backdrop, animated.backdrop]} />
      <View style={styles.cardBox}>
        <SpotlightCards current={shown} progress={progress} />
      </View>
      <Animated.View style={[styles.details, animated.details]}>
        <Text style={styles.hashtag}>{wallCopy.hashtag}</Text>
        <Text style={styles.caption} numberOfLines={3}>
          {photo.caption ?? wallCopy.noCaption}
        </Text>
        <View style={styles.chips}>
          {photo.tribe !== CATCH_ALL_TRIBE && (
            <Text style={styles.chip}>{TRIBES[photo.tribe]}</Text>
          )}
          <Text style={styles.time}>{formatRelative(photo.createdAt)}</Text>
        </View>
        <View style={styles.next}>
          <View style={styles.nextRow}>
            <Text style={styles.nextLabel}>{paused ? wallCopy.paused : wallCopy.nextPhoto}</Text>
            <Text style={styles.position}>{wallCopy.position(position, total)}</Text>
          </View>
          <ProgressLine
            width={SPOTLIGHT.detailsWidth}
            durationMs={durationMs}
            cycleKey={cycleKey}
            paused={paused}
          />
        </View>
      </Animated.View>
    </View>
  );
});

const CAPTION_SIZE = fontSize.title - 16;

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    flexDirection: "row",
    gap: SPOTLIGHT.gap,
    justifyContent: "center",
    zIndex: 60,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: color.spotlightScrim,
  },
  cardBox: {
    height: SPOTLIGHT.cardWidth * POLAROID.aspect,
    width: SPOTLIGHT.cardWidth,
  },
  // Padding sits outside the column (negative margin), so the layout maths stay the same.
  details: {
    backgroundColor: color.spotlightPanel,
    borderColor: color.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: space.md,
    margin: -space.lg,
    padding: space.lg,
    width: SPOTLIGHT.detailsWidth + space.lg * 2,
  },
  hashtag: {
    color: color.brandPrimaryText,
    fontSize: fontSize.heading,
    fontWeight: "800",
  },
  caption: {
    color: color.textPrimary,
    fontSize: CAPTION_SIZE,
    fontWeight: "800",
    letterSpacing: tracking.heading,
    lineHeight: CAPTION_SIZE * 1.15,
  },
  chips: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.md,
  },
  chip: {
    backgroundColor: color.brandSecondary,
    borderRadius: radius.pill,
    color: color.onBrandSecondary,
    fontSize: fontSize.caption + 1,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: space.md,
    paddingVertical: space.xs + 2,
  },
  time: {
    color: color.textSecondary,
    fontSize: fontSize.body,
  },
  next: {
    gap: space.sm,
    marginTop: space.lg,
  },
  nextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  nextLabel: {
    color: color.textMuted,
    fontSize: fontSize.caption - 1,
    fontWeight: "800",
    letterSpacing: tracking.label,
    textTransform: "uppercase",
  },
  position: {
    color: color.textPrimary,
    fontSize: fontSize.caption + 1,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
  },
});
