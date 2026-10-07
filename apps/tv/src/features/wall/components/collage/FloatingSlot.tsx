import type { PhotoDTO } from "@vegaos-demo/shared";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text } from "react-native";

import { wallCopy } from "@/features/wall/constants/copy";
import { POLAROID, type SlotPosition } from "@/features/wall/constants/layout";
import { IMAGE_REVEAL_FALLBACK_MS } from "@/features/wall/constants/timing";
import { color, fontSize, radius, space } from "@/theme/tokens";

import { PolaroidCard } from "./PolaroidCard";

export type FloatingSlotProps = {
  photo: PhotoDTO | null;
  slot: SlotPosition;
  index: number;
  isFresh: boolean;
  /** The selected copy is showing in SelectedPhoto; fade this card out underneath it. */
  lifted: boolean;
  onSettled: (photoId: string) => void;
};

const FRESH_MS = 6000;
const ENTER_MS = 650;
const EXIT_MS = 450;

export const FloatingSlot = memo(function FloatingSlot({ photo, ...rest }: FloatingSlotProps) {
  // Derived during render (not in an effect) so the outgoing card is never
  // unmounted for a frame: it keeps its instance and decoded image while it fades.
  const [shown, setShown] = useState<{ current: PhotoDTO | null; leaving: PhotoDTO | null }>({
    current: photo,
    leaving: null,
  });
  if (shown.current?.id !== photo?.id) {
    setShown({ current: photo, leaving: shown.current });
  }

  const leavingId = shown.leaving?.id;
  useEffect(() => {
    if (!leavingId) return;
    const timer = setTimeout(() => setShown((state) => ({ ...state, leaving: null })), EXIT_MS);
    return () => clearTimeout(timer);
  }, [leavingId]);

  return (
    <>
      {[shown.leaving, shown.current].map(
        (item) =>
          item && (
            <FloatingPhoto key={item.id} photo={item} exiting={item.id === leavingId} {...rest} />
          ),
      )}
    </>
  );
});

type FloatingPhotoProps = Omit<FloatingSlotProps, "photo"> & { photo: PhotoDTO; exiting: boolean };

const FloatingPhoto = memo(function FloatingPhoto({
  photo,
  slot,
  index,
  isFresh,
  exiting,
  lifted,
  onSettled,
}: FloatingPhotoProps) {
  const enter = useRef(new Animated.Value(0)).current;
  const exit = useRef(new Animated.Value(1)).current;
  const shown = useRef(new Animated.Value(lifted ? 0 : 1)).current;
  const drift = useRef(new Animated.Value(0)).current;
  const fresh = useRef(new Animated.Value(isFresh ? 1 : 0)).current;
  const arrivedLive = useRef(isFresh).current;

  useEffect(() => {
    // Each slot drifts on its own period so the wall never moves in lockstep.
    const half = 4200 + index * 370;
    const ease = { easing: Easing.inOut(Easing.sin), useNativeDriver: true };
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: half, ...ease }),
        Animated.timing(drift, { toValue: 0, duration: half, ...ease }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [drift, index]);

  useEffect(() => {
    Animated.timing(shown, {
      toValue: lifted ? 0 : 1,
      duration: 300,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [lifted, shown]);

  useEffect(() => {
    if (!exiting) return;
    Animated.timing(exit, {
      toValue: 0,
      duration: EXIT_MS,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [exit, exiting]);

  useEffect(() => {
    if (!isFresh) return;
    const timer = setTimeout(() => {
      Animated.timing(fresh, { toValue: 0, duration: 800, useNativeDriver: true }).start(() =>
        onSettled(photo.id),
      );
    }, FRESH_MS);
    return () => clearTimeout(timer);
  }, [fresh, isFresh, onSettled, photo.id]);

  // A stuck image load must never leave an invisible card.
  const revealed = useRef(false);
  const handleLoad = useCallback(() => {
    if (revealed.current) return;
    revealed.current = true;
    Animated.timing(enter, {
      toValue: 1,
      duration: ENTER_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter]);
  useEffect(() => {
    const timer = setTimeout(handleLoad, IMAGE_REVEAL_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [handleLoad]);

  // Built once per card: recreating animated nodes on re-render makes native-driven motion jump.
  const style = useMemo(
    () => ({
      opacity: Animated.multiply(Animated.multiply(enter, exit), shown),
      transform: [
        { translateX: slot.x },
        {
          translateY: Animated.add(
            drift.interpolate({ inputRange: [0, 1], outputRange: [-5, 5] }),
            slot.y,
          ),
        },
        {
          rotate: drift.interpolate({
            inputRange: [0, 1],
            outputRange: [`${slot.rotate - 1.2}deg`, `${slot.rotate + 1.2}deg`],
          }),
        },
        {
          scale: Animated.multiply(
            enter.interpolate({ inputRange: [0, 1], outputRange: [arrivedLive ? 1.35 : 0.9, 1] }),
            exit.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }),
          ),
        },
      ],
    }),
    [arrivedLive, drift, enter, exit, shown, slot],
  );

  return (
    <Animated.View style={[styles.root, style, { zIndex: index + 1 }]}>
      <Animated.View style={[styles.freshRing, { opacity: fresh }]} />
      <PolaroidCard photo={photo} width={POLAROID.width} onImageLoad={handleLoad} />
      {isFresh && (
        <Animated.View style={[styles.badge, { opacity: fresh }]}>
          <Text style={styles.badgeText}>{wallCopy.newBadge}</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
});

const ringBase = {
  borderRadius: space.sm,
  bottom: -space.xs - 1,
  left: -space.xs - 1,
  position: "absolute",
  right: -space.xs - 1,
  top: -space.xs - 1,
} as const;

const styles = StyleSheet.create({
  root: {
    left: 0,
    position: "absolute",
    top: 0,
  },
  freshRing: {
    ...ringBase,
    borderColor: color.brandPink,
    borderWidth: 3,
  },
  badge: {
    backgroundColor: color.brandPink,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    position: "absolute",
    right: -space.sm,
    top: -space.sm,
  },
  badgeText: {
    color: color.textOnFocus,
    fontSize: fontSize.caption - 2,
    fontWeight: "900",
    letterSpacing: 1,
  },
});
