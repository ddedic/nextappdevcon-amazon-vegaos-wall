import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

import { color, fontSize, layout, radius, space, tracking } from "../../../../theme/tokens";
import { wallCopy } from "../../constants/copy";
import { EMPTY_HERO, GHOST_SLOTS, POLAROID, type SlotPosition } from "../../constants/layout";
import { NATIVE_DRIVER } from "../../constants/motion";
import { TiltedSurface } from "../primitives/TiltedSurface";

export function EmptyWall() {
  const { empty } = wallCopy;

  return (
    <>
      {GHOST_SLOTS.map((slot, index) => (
        <GhostCard key={index} slot={slot} index={index} />
      ))}

      <View style={styles.hero}>
        <Text style={styles.eyebrow}>{empty.eyebrow}</Text>
        <Text style={styles.title}>{empty.title}</Text>
        <Text style={styles.body}>{empty.body}</Text>
        <View style={styles.steps}>
          {empty.steps.map((step, index) => (
            <View key={step} style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      </View>
    </>
  );
}

function GhostCard({ slot, index }: { slot: SlotPosition; index: number }) {
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const half = 3600 + index * 500;
    const ease = { easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE_DRIVER };
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: half, ...ease }),
        Animated.timing(drift, { toValue: 0, duration: half, ...ease }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [drift, index]);

  const style = useMemo(
    () => ({
      opacity: drift.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0.9] }),
      transform: [
        { translateX: slot.x },
        {
          translateY: Animated.add(
            drift.interpolate({ inputRange: [0, 1], outputRange: [-6, 6] }),
            slot.y,
          ),
        },
        {
          rotate: drift.interpolate({
            inputRange: [0, 1],
            outputRange: [`${slot.rotate - 1.5}deg`, `${slot.rotate + 1.5}deg`],
          }),
        },
      ],
    }),
    [drift, slot],
  );

  return (
    <TiltedSurface style={[styles.ghost, style]}>
      <View style={styles.ghostImage}>
        <Text style={styles.ghostPlus}>+</Text>
      </View>
      <Text style={styles.ghostLabel}>{wallCopy.empty.ghost}</Text>
    </TiltedSurface>
  );
}

const GHOST_IMAGE = POLAROID.width - space.md;

const styles = StyleSheet.create({
  hero: {
    gap: space.md,
    left: layout.safeX,
    position: "absolute",
    top: EMPTY_HERO.top,
    width: EMPTY_HERO.width,
  },
  eyebrow: {
    color: color.brandPrimaryText,
    fontSize: fontSize.caption,
    fontWeight: "800",
    letterSpacing: tracking.mark,
    textTransform: "uppercase",
  },
  title: {
    color: color.textPrimary,
    fontSize: fontSize.title,
    fontWeight: "800",
    letterSpacing: tracking.title,
    lineHeight: fontSize.title * 1.05,
  },
  body: {
    color: color.textSecondary,
    fontSize: fontSize.lead,
    lineHeight: fontSize.lead * 1.4,
  },
  steps: {
    flexDirection: "row",
    gap: space.lg,
    marginTop: space.sm,
  },
  step: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.sm,
  },
  stepNumber: {
    alignItems: "center",
    backgroundColor: color.brandPrimary,
    borderRadius: radius.pill,
    height: space.lg,
    justifyContent: "center",
    width: space.lg,
  },
  stepNumberText: {
    color: color.onBrandPrimary,
    fontSize: fontSize.caption,
    fontWeight: "900",
  },
  stepText: {
    color: color.textPrimary,
    fontSize: fontSize.body,
    fontWeight: "700",
  },
  ghost: {
    alignItems: "center",
    borderColor: color.textSecondary,
    borderRadius: space.xs,
    borderStyle: "dashed",
    borderWidth: 2,
    gap: space.xs,
    left: 0,
    padding: space.sm,
    position: "absolute",
    top: 0,
    width: POLAROID.width,
  },
  ghostImage: {
    alignItems: "center",
    backgroundColor: color.surface,
    borderRadius: 2,
    height: GHOST_IMAGE,
    justifyContent: "center",
    width: GHOST_IMAGE,
  },
  ghostPlus: {
    color: color.textSecondary,
    fontSize: fontSize.title,
    fontWeight: "300",
  },
  ghostLabel: {
    color: color.textSecondary,
    fontSize: fontSize.body,
    fontWeight: "800",
  },
});
