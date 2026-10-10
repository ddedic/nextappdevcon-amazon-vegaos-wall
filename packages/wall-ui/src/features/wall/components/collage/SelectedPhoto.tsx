import type { PhotoDTO } from "@boothwall/shared";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

import { color, radius, size, space } from "../../../../theme/tokens";
import { NOW_BAR, type PlacedPhoto, POLAROID, type SlotPosition } from "../../constants/layout";
import { NATIVE_DRIVER } from "../../constants/motion";
import { IMAGE_REVEAL_FALLBACK_MS } from "../../constants/timing";
import { TiltedSurface } from "../primitives/TiltedSurface";
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
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  }, [active, lift, loaded]);

  // Scaling grows the card around its centre; push top-row cards down so they clear the top bar.
  const growth = (CARD_HEIGHT * (LIFT_SCALE - 1)) / 2;
  // ...and lift bottom-row cards so the card and its dot stay clear of the now-showing strip.
  const dotBottom = slot.y + CARD_HEIGHT / 2 + (CARD_HEIGHT / 2 + space.md) * LIFT_SCALE;
  const liftY = Math.min(
    Math.max(-6, MIN_TOP + growth - slot.y),
    NOW_BAR.top - space.sm - dotBottom,
  );

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
    <TiltedSurface style={[styles.root, style]} pointerEvents="none">
      <View style={styles.halo} />
      <View style={styles.ring} />
      <PolaroidCard photo={photo} width={POLAROID.width} onImageLoad={handleLoad} raised />
      <View style={styles.dot} />
    </TiltedSurface>
  );
});

const styles = StyleSheet.create({
  root: {
    left: 0,
    position: "absolute",
    top: 0,
    zIndex: 40,
  },
  // White ring with a flat brand halo outside it. A blurred glow here cost a shadow pass per frame.
  ring: {
    borderColor: color.focusRing,
    borderRadius: space.sm,
    borderWidth: size.focusRing,
    bottom: -space.xs - 1,
    left: -space.xs - 1,
    position: "absolute",
    right: -space.xs - 1,
    top: -space.xs - 1,
  },
  halo: {
    borderColor: color.focusHalo,
    borderRadius: space.sm + size.focusHalo,
    borderWidth: size.focusHalo,
    bottom: -space.xs - 1 - size.focusHalo,
    left: -space.xs - 1 - size.focusHalo,
    position: "absolute",
    right: -space.xs - 1 - size.focusHalo,
    top: -space.xs - 1 - size.focusHalo,
  },
  dot: {
    alignSelf: "center",
    backgroundColor: color.focusRing,
    borderRadius: radius.pill,
    bottom: -space.md,
    height: size.focusDot,
    position: "absolute",
    width: size.focusDot,
  },
});
