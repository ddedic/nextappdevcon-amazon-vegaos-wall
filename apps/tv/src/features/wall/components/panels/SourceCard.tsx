import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { appConfig } from "@/app/app.config";
import githubMark from "@/assets/icons/github-mark.png";
import { QrCode } from "@/features/wall/components/primitives/QrCode";
import { wallCopy } from "@/features/wall/constants/copy";
import { SOURCE_CARD } from "@/features/wall/constants/layout";
import { color, fontSize, radius, space } from "@/theme/tokens";

const QR_SIZE = SOURCE_CARD.height - space.sm * 2 - 6;

export function SourceCard() {
  const { handle, scan } = wallCopy.author;

  return (
    <View style={styles.card} accessible accessibilityLabel={`Source on GitHub by ${handle}`}>
      <View style={styles.qrFrame}>
        <QrCode value={appConfig.sourceUrl} size={QR_SIZE} errorCorrection="L" />
      </View>
      <View style={styles.text}>
        <View style={styles.handleRow}>
          <Image source={githubMark} style={styles.mark} accessible={false} />
          <Text style={styles.handle}>{handle}</Text>
        </View>
        <Text style={styles.scan}>{scan}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: color.surface,
    borderColor: color.border,
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: "row",
    gap: space.sm + 2,
    height: SOURCE_CARD.height,
    left: SOURCE_CARD.left,
    paddingHorizontal: space.sm,
    position: "absolute",
    top: SOURCE_CARD.top,
    width: SOURCE_CARD.width,
    zIndex: 45,
  },
  qrFrame: {
    backgroundColor: color.paper,
    borderRadius: space.xs + 2,
    padding: 3,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  handleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.xs + 2,
  },
  mark: {
    height: 15,
    width: 15,
  },
  handle: {
    color: color.textPrimary,
    fontSize: fontSize.body - 1,
    fontWeight: "800",
  },
  scan: {
    color: color.textSecondary,
    fontSize: fontSize.caption - 1,
  },
});
