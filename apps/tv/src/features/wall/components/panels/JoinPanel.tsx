import { type Tribe, TRIBES, type WallStatsDTO } from "@vegaos-demo/shared";
import React, { memo, useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

import { appConfig } from "@/app/app.config";
import { PopNumber } from "@/features/wall/components/primitives/PopNumber";
import { QrCode } from "@/features/wall/components/primitives/QrCode";
import { wallCopy } from "@/features/wall/constants/copy";
import { PANEL, SOURCE_CARD } from "@/features/wall/constants/layout";
import { color, fontSize, radius, space } from "@/theme/tokens";

const BAR_WIDTH = PANEL.width - space.md * 2;

const QR_SIZE = 112;
/** Same gap between the cards and above the source card below. */
const PANEL_GAP = space.sm + 2;

export type JoinPanelProps = {
  stats: WallStatsDTO;
  attention?: boolean;
};

export function JoinPanel({ stats, attention = false }: JoinPanelProps) {
  const tribes = (Object.keys(TRIBES) as Tribe[])
    .filter((tribe) => tribe !== "other")
    .map((tribe) => ({ tribe, count: stats.byTribe[tribe] ?? 0 }))
    .sort((a, b) => b.count - a.count);
  const forFun = stats.byTribe.other ?? 0;
  const max = Math.max(1, forFun, ...tribes.map((t) => t.count));

  return (
    <View style={styles.panel}>
      <View style={styles.card}>
        {attention && <AttentionRing />}
        <Text style={styles.title}>{wallCopy.joinTitle}</Text>
        <View style={styles.qrFrame}>
          {/* Upper case lets the QR use alphanumeric mode: a coarser 25x25 code. */}
          <QrCode value={appConfig.joinUrl.toUpperCase()} size={QR_SIZE} />
        </View>
      </View>

      <View style={[styles.card, styles.battleCard]}>
        <Text style={styles.label}>{wallCopy.battleTitle}</Text>
        {tribes.map(({ tribe, count }, index) => (
          <TribeRow
            key={tribe}
            tribe={tribe}
            count={count}
            max={max}
            leader={index === 0 && count > 0}
          />
        ))}
        {/* Not a con: always last, never the leader, violet instead of pink. */}
        <TribeRow tribe="other" count={forFun} max={max} leader={false} neutral />
      </View>
    </View>
  );
}

type TribeRowProps = {
  tribe: Tribe;
  count: number;
  max: number;
  leader: boolean;
  neutral?: boolean;
};

const TribeRow = memo(function TribeRow({
  tribe,
  count,
  max,
  leader,
  neutral = false,
}: TribeRowProps) {
  const ratio = useRef(new Animated.Value(count / max)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const previous = useRef(count);

  useEffect(() => {
    Animated.timing(ratio, {
      toValue: count / max,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [count, max, ratio]);

  useEffect(() => {
    if (count <= previous.current) {
      previous.current = count;
      return;
    }
    previous.current = count;
    glow.setValue(1);
    Animated.timing(glow, { toValue: 0, duration: 1400, useNativeDriver: true }).start();
  }, [count, glow]);

  const glowStyle = useMemo(
    () => ({ opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.28] }) }),
    [glow],
  );

  // Full-width fill slid left by the missing share: width never animates, only a translate.
  const fillStyle = useMemo(
    () => ({
      transform: [
        { translateX: ratio.interpolate({ inputRange: [0, 1], outputRange: [-BAR_WIDTH, 0] }) },
      ],
    }),
    [ratio],
  );

  return (
    <View style={styles.tribeRow}>
      <Animated.View style={[styles.rowGlow, neutral && styles.neutralFill, glowStyle]} />
      <View style={styles.tribeHeader}>
        <Text style={[styles.tribeName, leader && styles.leader]}>{TRIBES[tribe]}</Text>
        <PopNumber value={count} style={styles.tribeCount} />
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, neutral && styles.neutralFill, fillStyle]} />
      </View>
    </View>
  );
});

function AttentionRing() {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const ease = { easing: Easing.inOut(Easing.sin), useNativeDriver: true };
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, ...ease }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, ...ease }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <>
      <Animated.View style={[styles.attention, { opacity: pulse }]} pointerEvents="none" />
      <View style={styles.scanMe}>
        <Text style={styles.scanMeText}>{wallCopy.empty.scanMe}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  attention: {
    borderColor: color.brandPink,
    borderRadius: radius.card + 2,
    borderWidth: 3,
    bottom: -3,
    left: -3,
    position: "absolute",
    right: -3,
    top: -3,
  },
  scanMe: {
    backgroundColor: color.brandPink,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    position: "absolute",
    right: space.md,
    top: -space.sm,
  },
  scanMeText: {
    color: color.textOnFocus,
    fontSize: fontSize.caption - 1,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  panel: {
    gap: PANEL_GAP,
    height: SOURCE_CARD.top - PANEL_GAP - PANEL.top,
    left: PANEL.left,
    position: "absolute",
    top: PANEL.top,
    width: PANEL.width,
  },
  card: {
    backgroundColor: color.surface,
    borderColor: color.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: space.sm,
    padding: space.md,
  },
  // Fills down to the source card so both gaps in the column match; rows share the slack.
  battleCard: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: space.sm + 4,
  },
  title: {
    color: color.textPrimary,
    fontSize: fontSize.body,
    fontWeight: "800",
    textAlign: "center",
  },
  qrFrame: {
    alignSelf: "center",
    backgroundColor: color.paper,
    borderRadius: space.sm,
    padding: space.sm,
  },
  label: {
    color: color.textMuted,
    fontSize: fontSize.caption - 1,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  tribeRow: {
    gap: 3,
  },
  neutralFill: {
    backgroundColor: color.brandViolet,
  },
  tribeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  tribeName: {
    color: color.textSecondary,
    fontSize: fontSize.caption - 1,
    fontWeight: "600",
  },
  leader: {
    color: color.textPrimary,
    fontWeight: "800",
  },
  tribeCount: {
    color: color.textPrimary,
    fontSize: fontSize.caption - 1,
    fontWeight: "800",
  },
  track: {
    backgroundColor: color.surfaceFocused,
    borderRadius: radius.pill,
    height: 3,
    overflow: "hidden",
  },
  fill: {
    backgroundColor: color.brandPink,
    borderRadius: radius.pill,
    height: 3,
    width: BAR_WIDTH,
  },
  rowGlow: {
    backgroundColor: color.brandPink,
    borderRadius: space.sm,
    bottom: -space.xs,
    left: -space.sm,
    position: "absolute",
    right: -space.sm,
    top: -space.xs,
  },
});
