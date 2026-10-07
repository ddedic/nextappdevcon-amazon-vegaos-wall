import React, { memo } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import devconLogo from "@/assets/brand/brand-devcon-logo.png";
import { PopNumber } from "@/features/wall/components/primitives/PopNumber";
import { wallCopy } from "@/features/wall/constants/copy";
import { EDGE, NOW_BAR } from "@/features/wall/constants/layout";
import type { FeedStatus } from "@/features/wall/state/connectionPhase";
import { color, fontSize, layout, space } from "@/theme/tokens";

import { DemoChip } from "./DemoChip";
import { StatusPill } from "./StatusPill";
import { YearMark } from "./YearMark";

const statusTone = {
  connecting: "pending",
  live: "success",
  offline: "danger",
  simulated: "pending",
} as const;

const LOGO_HEIGHT = 32;
const LOGO_ASPECT = 1229 / 376;

export type TopBarProps = {
  total: number;
  status: FeedStatus;
};

export const TopBar = memo(function TopBar({ total, status }: TopBarProps) {
  return (
    <View style={styles.bar}>
      <View style={styles.brand}>
        <Image
          source={devconLogo}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="next.app devCon"
        />
        <YearMark />
        <View style={styles.divider} />
        <DemoChip />
      </View>
      <View style={styles.meta}>
        <Text style={styles.hashtag}>{wallCopy.hashtag}</Text>
        <View style={styles.momentsRow}>
          <PopNumber value={total} style={styles.momentsCount} />
          <Text style={styles.moments}>{wallCopy.moments(total)}</Text>
        </View>
        <StatusPill tone={statusTone[status]} label={wallCopy.status[status]} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  bar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    left: NOW_BAR.left,
    position: "absolute",
    right: EDGE,
    top: layout.safeY - space.sm,
    zIndex: 50,
  },
  brand: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.md,
  },
  logo: {
    height: LOGO_HEIGHT,
    width: LOGO_HEIGHT * LOGO_ASPECT,
  },
  divider: {
    backgroundColor: color.border,
    height: space.lg,
    width: 1,
  },
  meta: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.md,
  },
  hashtag: {
    color: color.brandPink,
    fontSize: fontSize.lead,
    fontWeight: "800",
  },
  momentsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.xs + 1,
  },
  momentsCount: {
    color: color.textPrimary,
    fontSize: fontSize.caption + 3,
    fontWeight: "800",
  },
  moments: {
    color: color.textSecondary,
    fontSize: fontSize.caption + 1,
    fontWeight: "600",
  },
});
