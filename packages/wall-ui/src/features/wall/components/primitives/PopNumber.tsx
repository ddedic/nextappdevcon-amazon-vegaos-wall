import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, type TextStyle, View } from "react-native";

import { color, fontSize } from "../../../../theme/tokens";
import { NATIVE_DRIVER } from "../../constants/motion";

export type PopNumberProps = {
  value: number;
  style: TextStyle;
};

export const PopNumber = memo(function PopNumber({ value, style }: PopNumberProps) {
  const previous = useRef(value);
  const [delta, setDelta] = useState(0);
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const diff = value - previous.current;
    previous.current = value;
    if (diff <= 0) return;
    setDelta(diff);
    pop.setValue(0);
    Animated.timing(pop, {
      toValue: 1,
      duration: 1100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  }, [pop, value]);

  const animated = useMemo(
    () => ({
      number: {
        transform: [
          {
            scale: pop.interpolate({
              inputRange: [0, 0.15, 0.45, 1],
              outputRange: [1, 1.45, 1, 1],
            }),
          },
        ],
      },
      flash: {
        opacity: pop.interpolate({ inputRange: [0, 0.1, 0.7, 1], outputRange: [0, 1, 1, 0] }),
      },
      plus: {
        opacity: pop.interpolate({ inputRange: [0, 0.1, 0.75, 1], outputRange: [0, 1, 1, 0] }),
        transform: [{ translateY: pop.interpolate({ inputRange: [0, 1], outputRange: [0, -16] }) }],
      },
    }),
    [pop],
  );

  return (
    <View style={styles.root}>
      {delta > 0 && (
        <Animated.Text style={[styles.plus, animated.plus]}>{`+${delta}`}</Animated.Text>
      )}
      <Animated.View style={animated.number}>
        <Text style={style}>{value}</Text>
        {/* Pink copy on top that fades in and out: a colour flash without animating colour. */}
        <Animated.Text style={[style, styles.flash, animated.flash]}>{value}</Animated.Text>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    alignItems: "flex-end",
  },
  flash: {
    color: color.brandPrimaryText,
    left: 0,
    position: "absolute",
    right: 0,
    textAlign: "right",
    top: 0,
  },
  plus: {
    color: color.brandPrimaryText,
    fontSize: fontSize.caption,
    fontWeight: "900",
    position: "absolute",
    right: "100%",
    marginRight: 4,
    top: 0,
  },
});
