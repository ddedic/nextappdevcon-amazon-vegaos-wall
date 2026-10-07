import React from "react";
import { Pressable, StyleSheet } from "react-native";

export type SelectCatcherProps = {
  onSelect: () => void;
};

/** Some remotes deliver OK only as a press on the focused view; this invisible target catches it. */
export function SelectCatcher({ onSelect }: SelectCatcherProps) {
  return (
    <Pressable
      hasTVPreferredFocus
      focusable
      onPress={onSelect}
      style={styles.catcher}
      accessibilityLabel="Open the selected photo"
    />
  );
}

const styles = StyleSheet.create({
  catcher: {
    height: 1,
    left: 0,
    opacity: 0,
    position: "absolute",
    top: 0,
    width: 1,
  },
});
