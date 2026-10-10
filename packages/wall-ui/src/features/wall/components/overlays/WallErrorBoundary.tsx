import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { color, fontSize, space } from "../../../../theme/tokens";
import { wallCopy } from "../../constants/copy";
import { RESTART_AFTER_MS } from "../../constants/timing";

type Props = { children: ReactNode };
type State = { crashed: boolean; generation: number };

/**
 * An unattended booth screen must never sit on a red box or a blank frame: a render error
 * shows a calm "restarting" card, then remounts the whole tree from scratch.
 */
export class WallErrorBoundary extends Component<Props, State> {
  override state: State = { crashed: false, generation: 0 };
  private timer: ReturnType<typeof setTimeout> | undefined;

  static getDerivedStateFromError(): Partial<State> {
    return { crashed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Wall crashed, restarting", error, info.componentStack);
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = undefined;
      // A new key throws away every piece of state that led to the crash.
      this.setState(({ generation }) => ({ crashed: false, generation: generation + 1 }));
    }, RESTART_AFTER_MS);
  }

  override componentWillUnmount() {
    if (this.timer !== undefined) clearTimeout(this.timer);
  }

  override render() {
    const { crashed, generation } = this.state;
    if (crashed) {
      return (
        <View style={styles.screen} testID="wall-restarting">
          <Text style={styles.title}>{wallCopy.restarting.title}</Text>
          <Text style={styles.body}>{wallCopy.restarting.body}</Text>
        </View>
      );
    }
    return <React.Fragment key={generation}>{this.props.children}</React.Fragment>;
  }
}

const styles = StyleSheet.create({
  screen: {
    alignItems: "center",
    backgroundColor: color.canvas,
    flex: 1,
    gap: space.sm,
    justifyContent: "center",
  },
  title: {
    color: color.textPrimary,
    fontSize: fontSize.heading,
    fontWeight: "800",
  },
  body: {
    color: color.textSecondary,
    fontSize: fontSize.body,
  },
});
