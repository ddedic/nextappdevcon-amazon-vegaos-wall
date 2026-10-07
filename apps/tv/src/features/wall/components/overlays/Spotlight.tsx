import { TRIBES } from "@vegaos-demo/shared";
import React, { memo, useMemo } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { ProgressLine } from "@/features/wall/components/primitives/ProgressLine";
import { wallCopy } from "@/features/wall/constants/copy";
import { type PlacedPhoto, POLAROID, SPOTLIGHT } from "@/features/wall/constants/layout";
import { useSpotlightTransition } from "@/features/wall/hooks/useSpotlightTransition";
import { formatRelative } from "@/features/wall/utils/formatRelative";
import { color, fontSize, radius, space } from "@/theme/tokens";

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
          <Text style={styles.chip}>{TRIBES[photo.tribe]}</Text>
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
  details: {
    gap: space.md,
    width: SPOTLIGHT.detailsWidth,
  },
  hashtag: {
    color: color.brandPink,
    fontSize: fontSize.heading,
    fontWeight: "800",
  },
  caption: {
    color: color.textPrimary,
    fontSize: CAPTION_SIZE,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: CAPTION_SIZE * 1.15,
  },
  chips: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.md,
  },
  chip: {
    backgroundColor: color.brandViolet,
    borderRadius: radius.pill,
    color: color.textPrimary,
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
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  position: {
    color: color.textPrimary,
    fontSize: fontSize.caption + 1,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
  },
});
