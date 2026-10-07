import { type PhotoDTO, TRIBES } from "@vegaos-demo/shared";
import React, { memo, useMemo, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { wallCopy } from "@/features/wall/constants/copy";
import { color, space } from "@/theme/tokens";

export type PolaroidCardProps = {
  photo: PhotoDTO;
  width: number;
  onImageLoad?: () => void;
};

export const PolaroidCard = memo(function PolaroidCard({
  photo,
  width,
  onImageLoad,
}: PolaroidCardProps) {
  // A fresh `{ uri }` object on every render can make the native image view reload and flash.
  const source = useMemo(() => ({ uri: photo.imageUrl }), [photo.imageUrl]);
  const [failed, setFailed] = useState(false);
  const pad = width * 0.06;
  const imageSize = width - pad * 2;
  const unit = width / 118; // type scales with the card
  // "Just here for fun" is a phone option, not a label worth printing on the card.
  const showTribe = photo.tribe !== "other";

  return (
    <View style={[styles.card, { width, padding: pad, paddingBottom: pad * 1.1 }]}>
      {failed ? (
        <View style={[styles.placeholder, { width: imageSize, height: imageSize }]}>
          <Text style={[styles.placeholderText, { fontSize: 14 * unit }]}>{wallCopy.hashtag}</Text>
        </View>
      ) : (
        <Image
          source={source}
          style={{ width: imageSize, height: imageSize, borderRadius: 2 }}
          onLoad={onImageLoad}
          onError={() => {
            setFailed(true);
            onImageLoad?.();
          }}
        />
      )}
      <Text
        style={[styles.caption, { fontSize: 10 * unit, marginTop: pad * 0.9 }]}
        numberOfLines={1}
      >
        {photo.caption ?? wallCopy.noCaption}
      </Text>
      <View
        style={[
          styles.meta,
          { marginTop: 2 * unit, gap: 4 * unit },
          !showTribe && styles.metaCentered,
        ]}
      >
        {showTribe && (
          <Text style={[styles.tribe, { fontSize: 6.5 * unit }]} numberOfLines={1}>
            {TRIBES[photo.tribe]}
          </Text>
        )}
        <Text style={[styles.hashtag, { fontSize: 6.5 * unit }]} numberOfLines={1}>
          {wallCopy.hashtag}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  placeholder: {
    alignItems: "center",
    backgroundColor: color.brandViolet,
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
    elevation: 8,
    shadowColor: color.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  caption: {
    color: color.paperInk,
    fontWeight: "600",
    textAlign: "center",
  },
  meta: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaCentered: {
    justifyContent: "center",
  },
  tribe: {
    color: color.brandViolet,
    fontWeight: "800",
    flexShrink: 1,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  hashtag: {
    color: color.brandPink,
    flexShrink: 0,
    fontWeight: "800",
  },
});
