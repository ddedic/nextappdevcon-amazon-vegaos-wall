import { EVENT } from "@boothwall/shared";
import React, { memo, useMemo } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import logo from "../../../../assets/brand/logo.png";
import { color, fontSize, layout, size, space } from "../../../../theme/tokens";
import { wallCopy } from "../../constants/copy";
import { EDGE, NOW_BAR } from "../../constants/layout";
import type { FeedStatus } from "../../state/connectionPhase";
import { imageSource, useImageAspect } from "../../utils/bundledImage";
import { PopNumber } from "../primitives/PopNumber";
import { DemoChip } from "./DemoChip";
import { StatusPill } from "./StatusPill";
import { YearMark } from "./YearMark";

const statusTone = {
  connecting: "pending",
  live: "success",
  offline: "danger",
  simulated: "pending",
} as const;

const LOGO = imageSource(logo);

export type TopBarProps = {
  total: number;
  status: FeedStatus;
};

export const TopBar = memo(function TopBar({ total, status }: TopBarProps) {
  // Any logo works: its width follows the image's own aspect ratio at a fixed height.
  // On the web the ratio arrives once the image has loaded; until then the logo takes no room.
  const aspect = useImageAspect(logo);
  const logoStyle = useMemo(
    () => [styles.logo, { width: size.logoHeight * (aspect ?? 0) }],
    [aspect],
  );
  return (
    <View style={styles.bar}>
      <View style={styles.brand}>
        <Image
          source={LOGO}
          style={logoStyle}
          resizeMode="contain"
          accessibilityLabel={EVENT.name}
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
    height: size.logoHeight,
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
    color: color.brandPrimaryText,
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
