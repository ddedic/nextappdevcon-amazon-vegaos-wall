import { CATCH_ALL_TRIBE, type Tribe, TRIBES, type WallStatsDTO } from "@boothwall/shared";
import React, { memo, useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

import { appConfig } from "../../../../app/app.config";
import { color, fontSize, radius, size, space, tracking } from "../../../../theme/tokens";
import { wallCopy } from "../../constants/copy";
import { PANEL, SOURCE_CARD } from "../../constants/layout";
import { NATIVE_DRIVER } from "../../constants/motion";
import { PopNumber } from "../primitives/PopNumber";
import { QrCode } from "../primitives/QrCode";

/** The battle card's padding, the same on every side. */
const BATTLE_PAD = space.sm + 4;
const BAR_WIDTH = PANEL.width - BATTLE_PAD * 2;

/** The join URL without its scheme, printed under the QR for phones that can't scan. */
const JOIN_HOST = appConfig.joinUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

/** Same gap between the cards and above the source card below. */
const PANEL_GAP = space.sm + 2;

export type JoinPanelProps = {
  stats: WallStatsDTO;
  attention?: boolean;
};

export const JoinPanel = memo(function JoinPanel({ stats, attention = false }: JoinPanelProps) {
  const tribes = (Object.keys(TRIBES) as Tribe[])
    .filter((tribe) => tribe !== CATCH_ALL_TRIBE)
    .map((tribe) => ({ tribe, count: stats.byTribe[tribe] ?? 0 }))
    .sort((a, b) => b.count - a.count);
  const forFun = CATCH_ALL_TRIBE ? (stats.byTribe[CATCH_ALL_TRIBE] ?? 0) : 0;
  const max = Math.max(1, forFun, ...tribes.map((t) => t.count));

  return (
    <View style={styles.panel}>
      <View style={styles.card}>
        {attention && <AttentionRing />}
        <Text style={styles.title}>{wallCopy.joinTitle}</Text>
        <View style={styles.qrFrame}>
          {/* Upper case lets the QR use alphanumeric mode: a coarser 25x25 code. */}
          <QrCode value={appConfig.joinUrl.toUpperCase()} size={size.joinQr} />
        </View>
        <Text style={styles.joinHost} numberOfLines={1}>
          {JOIN_HOST}
        </Text>
      </View>

      <View style={[styles.card, styles.battleCard]}>
        <Text style={styles.battleTitle}>{wallCopy.battleTitle}</Text>
        {tribes.map(({ tribe, count }, index) => (
          <TribeRow
            key={tribe}
            tribe={tribe}
            count={count}
            max={max}
            leader={index === 0 && count > 0}
          />
        ))}
        {/* The catch-all isn't competing: set apart below a divider, smaller and neutral. */}
        {CATCH_ALL_TRIBE && (
          <>
            <View style={styles.divider} />
            <TribeRow tribe={CATCH_ALL_TRIBE} count={forFun} max={max} leader={false} neutral />
          </>
        )}
      </View>
    </View>
  );
});

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
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  }, [count, max, ratio]);

  useEffect(() => {
    if (count <= previous.current) {
      previous.current = count;
      return;
    }
    previous.current = count;
    glow.setValue(1);
    Animated.timing(glow, { toValue: 0, duration: 1400, useNativeDriver: NATIVE_DRIVER }).start();
  }, [count, glow]);

  const glowStyle = useMemo(
    () => ({ opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.28] }) }),
    [glow],
  );

  // The rank dot pops in whenever this row takes the lead.
  const rank = useRef(new Animated.Value(leader ? 1 : 0)).current;
  useEffect(() => {
    if (!leader) return;
    rank.setValue(0);
    Animated.spring(rank, { toValue: 1, friction: 4, useNativeDriver: NATIVE_DRIVER }).start();
  }, [leader, rank]);
  const rankStyle = useMemo(() => ({ transform: [{ scale: rank }] }), [rank]);

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
      <Animated.View style={[styles.rowGlow, neutral && styles.neutralGlow, glowStyle]} />
      <View style={styles.tribeHeader}>
        {leader && <Animated.View style={[styles.rankDot, rankStyle]} />}
        <Text
          style={[styles.tribeName, leader && styles.leader, neutral && styles.neutralName]}
          numberOfLines={1}
        >
          {TRIBES[tribe]}
        </Text>
        <PopNumber
          value={count}
          style={StyleSheet.flatten([
            styles.tribeCount,
            !leader && styles.tribeCountMuted,
            neutral && styles.neutralName,
          ])}
        />
      </View>
      <View style={[styles.track, leader && styles.leaderTrack, neutral && styles.neutralTrack]}>
        <Animated.View
          style={[
            styles.fill,
            leader ? styles.leaderFill : styles.mutedFill,
            neutral && styles.neutralFill,
            fillStyle,
          ]}
        />
      </View>
    </View>
  );
});

function AttentionRing() {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const ease = { easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE_DRIVER };
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
    borderColor: color.brandPrimary,
    borderRadius: radius.card + 2,
    borderWidth: size.focusRing,
    bottom: -size.focusRing,
    left: -size.focusRing,
    position: "absolute",
    right: -size.focusRing,
    top: -size.focusRing,
  },
  scanMe: {
    backgroundColor: color.brandPrimary,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    position: "absolute",
    right: space.md,
    top: -space.sm,
  },
  scanMeText: {
    color: color.onBrandPrimary,
    fontSize: fontSize.caption - 1,
    fontWeight: "900",
    letterSpacing: tracking.label,
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
  // Fills down to the source card; equal padding on every side, rows share the slack evenly.
  battleCard: {
    flex: 1,
    gap: 0,
    justifyContent: "space-between",
    padding: BATTLE_PAD,
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
  joinHost: {
    color: color.textMuted,
    fontSize: fontSize.caption - 1,
    fontWeight: "600",
    textAlign: "center",
  },
  battleTitle: {
    color: color.textPrimary,
    fontSize: fontSize.caption + 1,
    fontWeight: "800",
  },
  divider: {
    backgroundColor: color.border,
    height: StyleSheet.hairlineWidth,
  },
  tribeRow: {
    gap: 3,
  },
  neutralGlow: {
    backgroundColor: color.textMuted,
  },
  tribeHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.xs + 1,
  },
  rankDot: {
    backgroundColor: color.brandPrimary,
    borderRadius: radius.pill,
    height: size.rankDot,
    width: size.rankDot,
  },
  tribeName: {
    color: color.textSecondary,
    flex: 1,
    fontSize: fontSize.caption - 1,
    fontWeight: "600",
  },
  neutralName: {
    color: color.textMuted,
    fontSize: fontSize.caption - 2,
  },
  leader: {
    color: color.textPrimary,
    fontWeight: "800",
  },
  tribeCount: {
    color: color.textPrimary,
    fontSize: fontSize.caption - 1,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
  },
  tribeCountMuted: {
    color: color.textSecondary,
  },
  track: {
    backgroundColor: color.surfaceFocused,
    borderRadius: radius.pill,
    height: size.barTrack,
    overflow: "hidden",
  },
  leaderTrack: {
    height: size.leaderBar,
  },
  neutralTrack: {
    height: size.stripLine,
  },
  fill: {
    borderRadius: radius.pill,
    height: "100%",
    width: BAR_WIDTH,
  },
  leaderFill: {
    backgroundColor: color.brandPrimary,
  },
  mutedFill: {
    backgroundColor: color.brandPrimaryMuted,
  },
  neutralFill: {
    backgroundColor: color.textMuted,
  },
  rowGlow: {
    backgroundColor: color.brandPrimary,
    borderRadius: space.sm,
    bottom: -space.xs,
    left: -space.sm,
    position: "absolute",
    right: -space.sm,
    top: -space.xs,
  },
});
