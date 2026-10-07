import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

import { appConfig } from "@/app/app.config";
import { wallCopy } from "@/features/wall/constants/copy";
import { CONNECTING_CARD_WIDTH } from "@/features/wall/constants/layout";
import { CONNECTION_FADE_MS, SPINNER_TURN_MS } from "@/features/wall/constants/timing";
import type { ConnectionPhase } from "@/features/wall/state/connectionPhase";
import { color, fontSize, radius, space } from "@/theme/tokens";

export type ConnectingOverlayProps = {
  phase: ConnectionPhase;
  attempts: number;
};

const host = appConfig.apiBaseUrl.replace(/^https?:\/\//, "");

/** Covers the empty wall until the first snapshot lands, so a slow start never reads as "no photos". */
export const ConnectingOverlay = memo(function ConnectingOverlay({
  phase,
  attempts,
}: ConnectingOverlayProps) {
  const visible = phase !== "ready";
  const [mounted, setMounted] = useState(visible);
  const show = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    if (visible) setMounted(true);
    Animated.timing(show, {
      toValue: visible ? 1 : 0,
      duration: CONNECTION_FADE_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => finished && !visible && setMounted(false));
  }, [show, visible]);

  if (!mounted) return null;

  const failed = phase === "failed";
  return (
    <Animated.View style={[styles.overlay, { opacity: show }]} pointerEvents="none">
      <View style={styles.card} accessibilityLiveRegion="polite">
        <Spinner tone={failed ? color.warning : color.brandPink} />
        <Text style={styles.title}>
          {failed
            ? wallCopy.connection.failedTitle
            : wallCopy.connection[phase === "loading" ? "loading" : "connecting"]}
        </Text>
        {failed ? (
          <>
            <Text style={styles.body}>{wallCopy.connection.failedBody}</Text>
            <Text
              style={styles.meta}
            >{`${host}  ·  ${wallCopy.connection.attempt(attempts)}`}</Text>
          </>
        ) : (
          <Text style={styles.meta}>{host}</Text>
        )}
      </View>
    </Animated.View>
  );
});

function Spinner({ tone }: { tone: string }) {
  const turn = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(turn, {
        toValue: 1,
        duration: SPINNER_TURN_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const ease = { easing: Easing.inOut(Easing.sin), useNativeDriver: true };
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: SPINNER_TURN_MS, ...ease }),
        Animated.timing(pulse, { toValue: 0, duration: SPINNER_TURN_MS, ...ease }),
      ]),
    );
    spin.start();
    breathe.start();
    return () => {
      spin.stop();
      breathe.stop();
    };
  }, [turn, pulse]);

  const arcStyle = useMemo(
    () => ({
      transform: [
        { rotate: turn.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) },
      ],
    }),
    [turn],
  );
  const haloStyle = useMemo(
    () => ({
      opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.45] }),
      transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] }) }],
    }),
    [pulse],
  );

  return (
    <View style={styles.spinner}>
      <Animated.View style={[styles.halo, { backgroundColor: tone }, haloStyle]} />
      <View style={styles.track} />
      <Animated.View
        style={[styles.arc, { borderTopColor: tone, borderRightColor: tone }, arcStyle]}
      />
      <View style={[styles.core, { backgroundColor: tone }]} />
    </View>
  );
}

const SPINNER = space["2xl"];
const RING = 3;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: color.spotlightScrim,
    justifyContent: "center",
    zIndex: 100,
  },
  card: {
    alignItems: "center",
    backgroundColor: color.canvas,
    borderColor: color.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: space.sm + 2,
    maxWidth: CONNECTING_CARD_WIDTH,
    paddingHorizontal: space.xl,
    paddingVertical: space.lg,
  },
  spinner: {
    alignItems: "center",
    height: SPINNER,
    justifyContent: "center",
    marginBottom: space.xs,
    width: SPINNER,
  },
  halo: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.pill,
  },
  track: {
    ...StyleSheet.absoluteFillObject,
    borderColor: color.border,
    borderRadius: radius.pill,
    borderWidth: RING,
  },
  arc: {
    ...StyleSheet.absoluteFillObject,
    borderBottomColor: color.transparent,
    borderLeftColor: color.transparent,
    borderRadius: radius.pill,
    borderWidth: RING,
  },
  core: {
    borderRadius: radius.pill,
    height: space.sm,
    width: space.sm,
  },
  title: {
    color: color.textPrimary,
    fontSize: fontSize.lead,
    fontWeight: "800",
    textAlign: "center",
  },
  body: {
    color: color.textSecondary,
    fontSize: fontSize.body - 2,
    textAlign: "center",
  },
  meta: {
    color: color.textMuted,
    fontSize: fontSize.caption,
    fontWeight: "600",
  },
});
