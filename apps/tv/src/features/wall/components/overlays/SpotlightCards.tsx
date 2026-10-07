import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet } from "react-native";

import { PolaroidCard } from "@/features/wall/components/collage/PolaroidCard";
import {
  CANVAS_HEIGHT,
  type PlacedPhoto,
  POLAROID,
  type SlotPosition,
  SPOTLIGHT,
} from "@/features/wall/constants/layout";

const SWAP_MS = 400;
const SWAP_SHIFT = 24;

/** Offset and scale that put the spotlight card exactly over a wall card. */
function zoomFrom(slot: SlotPosition) {
  const wallHeight = POLAROID.width * POLAROID.aspect;
  return {
    dx: slot.x + POLAROID.width / 2 - (SPOTLIGHT.cardLeft + SPOTLIGHT.cardWidth / 2),
    dy: slot.y + wallHeight / 2 - CANVAS_HEIGHT / 2,
    scale: POLAROID.width / SPOTLIGHT.cardWidth,
  };
}

export type SpotlightCardsProps = {
  current: PlacedPhoto;
  progress: Animated.Value;
};

/** Crossfades photos while the spotlight stays open. */
export const SpotlightCards = memo(function SpotlightCards({
  current,
  progress,
}: SpotlightCardsProps) {
  const [cards, setCards] = useState<{
    current: PlacedPhoto;
    leaving: PlacedPhoto | null;
    swapped: boolean;
  }>({ current, leaving: null, swapped: false });
  if (cards.current.photo.id !== current.photo.id) {
    setCards({ current, leaving: cards.current, swapped: true });
  }

  const leavingId = cards.leaving?.photo.id;
  useEffect(() => {
    if (!leavingId) return;
    const timer = setTimeout(() => setCards((state) => ({ ...state, leaving: null })), SWAP_MS);
    return () => clearTimeout(timer);
  }, [leavingId]);

  return (
    <>
      {[cards.leaving, cards.current].map(
        (item) =>
          item && (
            <SpotlightCard
              key={item.photo.id}
              placed={item}
              progress={progress}
              entering={item === cards.current && cards.swapped}
              exiting={item.photo.id === leavingId}
            />
          ),
      )}
    </>
  );
});

type SpotlightCardProps = {
  placed: PlacedPhoto;
  progress: Animated.Value;
  entering: boolean;
  exiting: boolean;
};

// progress: 0 on the wall slot, 1 centred. presence: 0 incoming, 1 shown, 2 gone.
const SpotlightCard = memo(function SpotlightCard({
  placed,
  progress,
  entering,
  exiting,
}: SpotlightCardProps) {
  const presence = useRef(new Animated.Value(entering ? 0 : 1)).current;

  useEffect(() => {
    if (!entering) return;
    Animated.timing(presence, {
      toValue: 1,
      duration: SWAP_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entering, presence]);

  useEffect(() => {
    if (!exiting) return;
    Animated.timing(presence, {
      toValue: 2,
      duration: SWAP_MS,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [exiting, presence]);

  const { slot } = placed;
  const style = useMemo(() => {
    const from = zoomFrom(slot);
    return {
      opacity: Animated.multiply(
        progress.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 1] }),
        presence.interpolate({ inputRange: [0, 1, 2], outputRange: [0, 1, 0] }),
      ),
      transform: [
        {
          translateX: Animated.add(
            progress.interpolate({ inputRange: [0, 1], outputRange: [from.dx, 0] }),
            presence.interpolate({
              inputRange: [0, 1, 2],
              outputRange: [SWAP_SHIFT, 0, -SWAP_SHIFT],
            }),
          ),
        },
        { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [from.dy, 0] }) },
        {
          rotate: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [`${slot.rotate}deg`, `${SPOTLIGHT.cardRotate}deg`],
          }),
        },
        { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [from.scale, 1] }) },
      ],
    };
  }, [presence, progress, slot]);

  return (
    <Animated.View style={[styles.card, style]}>
      <PolaroidCard photo={placed.photo} width={SPOTLIGHT.cardWidth} />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    left: 0,
    position: "absolute",
    top: 0,
  },
});
