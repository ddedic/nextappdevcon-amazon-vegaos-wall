import { CATCH_ALL_TRIBE, type PhotoDTO, TRIBES } from "@boothwall/shared";
import React, { memo, useEffect, useMemo, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { color, size, space, tracking } from "../../../../theme/tokens";
import { wallCopy } from "../../constants/copy";
import { POLAROID, POLAROID_TYPE } from "../../constants/layout";
import { IMAGE_RETRY_MS } from "../../constants/timing";

export type PolaroidCardProps = {
  photo: PhotoDTO;
  width: number;
  onImageLoad?: () => void;
  /**
   * A real blurred shadow, for the one or two cards lifted above the wall. Wall cards get a
   * soft fake shadow instead: a dozen blurred shadows moving every frame is too much for a Stick.
   */
  raised?: boolean;
};

export const PolaroidCard = memo(function PolaroidCard({
  photo,
  width,
  onImageLoad,
  raised = false,
}: PolaroidCardProps) {
  // A fresh `{ uri }` object on every render can make the native image view reload and flash.
  // Wall-size cards decode the small thumbnail; only the bigger spotlight card needs the original.
  const uri = width > POLAROID.width ? photo.imageUrl : photo.thumbUrl;
  const source = useMemo(() => ({ uri }), [uri]);
  // A failed load (flaky booth Wi-Fi) remounts the Image a couple of times before giving up.
  const [attempt, setAttempt] = useState(0);
  const [errored, setErrored] = useState(false);
  const retryIn = errored ? IMAGE_RETRY_MS[attempt] : undefined;
  const failed = errored && retryIn === undefined;
  useEffect(() => {
    if (retryIn === undefined) return;
    const timer = setTimeout(() => {
      setErrored(false);
      setAttempt((n) => n + 1);
    }, retryIn);
    return () => clearTimeout(timer);
  }, [retryIn]);
  const pad = width * 0.06;
  const imageSize = width - pad * 2;
  const unit = width / POLAROID_TYPE.baseWidth;
  const caption = photo.caption ?? wallCopy.noCaption;
  // The big spotlight card has room for a second line instead of the smallest size.
  const big = width > POLAROID.width;
  const captionSize =
    caption.length <= POLAROID_TYPE.short
      ? POLAROID_TYPE.caption.large
      : big || caption.length <= POLAROID_TYPE.medium
        ? POLAROID_TYPE.caption.medium
        : POLAROID_TYPE.caption.small;
  // The catch-all category ("Just visiting") isn't worth printing on the card.
  const showTribe = photo.tribe !== CATCH_ALL_TRIBE;

  return (
    <View style={{ width }}>
      {!raised && <View style={styles.plateOuter} />}
      {!raised && <View style={styles.plateInner} />}
      <View
        style={[styles.card, raised && styles.raised, { padding: pad, paddingBottom: pad * 1.5 }]}
      >
        {failed ? (
          <View style={[styles.placeholder, { width: imageSize, height: imageSize }]}>
            <Text style={[styles.placeholderText, { fontSize: 14 * unit }]}>
              {wallCopy.hashtag}
            </Text>
          </View>
        ) : (
          <Image
            key={attempt}
            source={source}
            style={{ width: imageSize, height: imageSize, borderRadius: 2 }}
            onLoad={onImageLoad}
            onError={() => {
              setErrored(true);
              // Out of retries: reveal the card with its placeholder.
              if (attempt >= IMAGE_RETRY_MS.length) onImageLoad?.();
            }}
          />
        )}
        <Text
          style={[
            styles.caption,
            {
              fontSize: captionSize * unit,
              lineHeight: POLAROID_TYPE.captionLine * unit,
              marginTop: pad * 0.95,
            },
          ]}
          numberOfLines={big ? 2 : 1}
        >
          {caption}
        </Text>
        {/* One Text, so the category and hashtag share a baseline whatever their case. */}
        <Text
          style={[
            styles.meta,
            {
              fontSize: POLAROID_TYPE.meta * unit,
              letterSpacing: POLAROID_TYPE.metaTracking * unit,
              marginTop: POLAROID_TYPE.metaGap * unit,
            },
          ]}
          numberOfLines={1}
        >
          {showTribe && <Text style={styles.tribe}>{TRIBES[photo.tribe].toUpperCase()}</Text>}
          {showTribe && <Text style={styles.separator}>{"  ·  "}</Text>}
          <Text style={styles.hashtag}>{wallCopy.hashtag}</Text>
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  placeholder: {
    alignItems: "center",
    backgroundColor: color.brandSecondary,
    borderRadius: 2,
    justifyContent: "center",
  },
  placeholderText: {
    color: color.textPrimary,
    fontWeight: "800",
  },
  card: {
    backgroundColor: color.paper,
    borderRadius: space.xs,
  },
  raised: {
    elevation: 8,
    shadowColor: color.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  // Two faint, slightly larger plates fake a soft shadow: no blur pass, and no hard slab.
  plateOuter: {
    backgroundColor: color.cardShadowOuter,
    borderRadius: space.xs + size.shadowSpread,
    bottom: -size.shadowSpread - 1,
    left: -size.shadowSpread,
    position: "absolute",
    right: -size.shadowSpread,
    top: -size.shadowSpread + 2,
  },
  plateInner: {
    backgroundColor: color.cardShadowInner,
    borderRadius: space.xs + 1,
    bottom: -2,
    left: -1,
    position: "absolute",
    right: -1,
    top: 1,
  },
  caption: {
    color: color.paperInk,
    fontWeight: "500",
    letterSpacing: tracking.caption,
    textAlign: "center",
  },
  meta: {
    fontWeight: "700",
    textAlign: "center",
  },
  tribe: {
    color: color.brandSecondaryOnPaper,
  },
  separator: {
    color: color.paperInkMuted,
  },
  hashtag: {
    color: color.brandPrimaryOnPaper,
  },
});
