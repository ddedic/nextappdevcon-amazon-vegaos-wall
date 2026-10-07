import type { PhotoDTO } from "@vegaos-demo/shared";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

import { type PlacedPhoto, POLAROID, type SlotPosition } from "@/features/wall/constants/layout";
import { IMAGE_REVEAL_FALLBACK_MS } from "@/features/wall/constants/timing";
import { color, radius, space } from "@/theme/tokens";

import { PolaroidCard } from "./PolaroidCard";

export type SelectedPhotoProps = {
  selection: PlacedPhoto | null;
};

const LIFT_MS = 420;
const LIFT_SCALE = 1.2;
/** Lifted cards must stay below the top bar. */
const MIN_TOP = 84;
/** Approximate polaroid height at POLAROID.width, used to keep the scaled card on screen. */
const CARD_HEIGHT = POLAROID.width * POLAROID.aspect;

/** A lifted copy in its own layer: reordering native views makes cards blink on Vega. */
export const SelectedPhoto = memo(function SelectedPhoto({ selection }: SelectedPhotoProps) {
  const [shown, setShown] = useState<{ current: PlacedPhoto | null; leaving: PlacedPhoto | null }>({
    current: selection,
    leaving: null,
  });
  if (shown.current?.photo.id !== selection?.photo.id) {
    setShown({ current: selection, leaving: shown.current });
  }

  const leavingId = shown.leaving?.photo.id;
  useEffect(() => {
    if (!leavingId) return;
    const timer = setTimeout(() => setShown((state) => ({ ...state, leaving: null })), LIFT_MS);
    return () => clearTimeout(timer);
  }, [leavingId]);

  return (
    <>
      {[shown.leaving, shown.current].map(
        (item) =>
          item && (
            <LiftedCard
              key={item.photo.id}
              photo={item.photo}
              slot={item.slot}
              active={item.photo.id === selection?.photo.id}
            />
          ),
      )}
    </>
  );
});

const LiftedCard = memo(function LiftedCard({
  photo,
  slot,
  active,
}: {
  photo: PhotoDTO;
  slot: SlotPosition;
  active: boolean;
}) {
  const lift = useRef(new Animated.Value(0)).current;
  const [loaded, setLoaded] = useState(false);
  const handleLoad = useCallback(() => setLoaded(true), []);
  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), IMAGE_REVEAL_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (active && !loaded) return; // wait for the image so the copy never shows an empty frame
    Animated.timing(lift, {
      toValue: active ? 1 : 0,
      duration: LIFT_MS,
      easing: active ? Easing.out(Easing.cubic) : Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [active, lift, loaded]);

  // Scaling grows the card around its centre; push top-row cards down so they clear the top bar.
  const growth = (CARD_HEIGHT * (LIFT_SCALE - 1)) / 2;
  const liftY = Math.max(-6, MIN_TOP + growth - slot.y);

  const style = useMemo(
    () => ({
      opacity: lift,
      transform: [
        { translateX: slot.x },
        {
          translateY: Animated.add(
            lift.interpolate({ inputRange: [0, 1], outputRange: [0, liftY] }),
            slot.y,
          ),
        },
        {
          rotate: lift.interpolate({
            inputRange: [0, 1],
            outputRange: [`${slot.rotate}deg`, "0deg"],
          }),
        },
        { scale: lift.interpolate({ inputRange: [0, 1], outputRange: [1, LIFT_SCALE] }) },
      ],
    }),
    [lift, liftY, slot],
  );

  return (
    <Animated.View style={[styles.root, style]} pointerEvents="none">
      <View style={styles.ring} />
      <PolaroidCard photo={photo} width={POLAROID.width} onImageLoad={handleLoad} />
      <View style={styles.dot} />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  root: {
    left: 0,
    position: "absolute",
    top: 0,
    zIndex: 40,
  },
  ring: {
    borderColor: color.focusRing,
    borderRadius: space.sm,
    borderWidth: 3,
    bottom: -space.xs - 1,
    left: -space.xs - 1,
    position: "absolute",
    right: -space.xs - 1,
    shadowColor: color.brandPink,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 16,
    top: -space.xs - 1,
  },
  dot: {
    alignSelf: "center",
    backgroundColor: color.focusRing,
    borderRadius: radius.pill,
    bottom: -space.md,
    height: 6,
    position: "absolute",
    width: 6,
  },
});
