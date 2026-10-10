import type { RemoteCommand } from "@boothwall/shared";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { ImageBackground, StyleSheet } from "react-native";

import backdrop from "../../../assets/brand/backdrop.jpg";
import { color } from "../../../theme/tokens";
import { WallCollage } from "../components/collage/WallCollage";
import { ConnectingOverlay } from "../components/overlays/ConnectingOverlay";
import { ExitHint } from "../components/overlays/ExitHint";
import { IncomingToast } from "../components/overlays/IncomingToast";
import { NowShowingBar } from "../components/overlays/NowShowingBar";
import { Spotlight } from "../components/overlays/Spotlight";
import { JoinPanel } from "../components/panels/JoinPanel";
import { SourceCard } from "../components/panels/SourceCard";
import { TopBar } from "../components/panels/TopBar";
import { SelectCatcher } from "../components/primitives/SelectCatcher";
import { SLOTS } from "../constants/layout";
import { type RemoteCommands, useWallDirector } from "../hooks/useWallDirector";
import { useWallFeed } from "../hooks/useWallFeed";
import { type RemoteInputHook, useWallRemote } from "../hooks/useWallRemote";
import { imageSource } from "../utils/bundledImage";

export type WallScreenProps = {
  /** The platform's remote input (see RemoteInputHook). */
  useRemoteInput: RemoteInputHook;
  /** Run on the bundled demo photos whatever boothwall.config.ts says. */
  demo?: boolean;
};

const BACKDROP = imageSource(backdrop);

export function WallScreen({ useRemoteInput, demo }: WallScreenProps) {
  // The phone remote arrives over the feed socket, before the director exists.
  const commandsRef = useRef<RemoteCommands | null>(null);
  const onRemote = useCallback((command: RemoteCommand) => commandsRef.current?.[command](), []);
  const {
    state: wall,
    status,
    connection,
    settle,
    rotate,
    show,
    pin,
  } = useWallFeed({
    onRemote,
    demo,
  });
  const director = useWallDirector({ wall, rotate, show, pin });
  const { selectedSlot, selectedPhoto, filledSlots, spotlight, commands } = director;

  useEffect(() => {
    commandsRef.current = commands;
  }, [commands]);
  const { exitArmed } = useWallRemote(commands, spotlight, useRemoteInput);

  const slot = SLOTS[selectedSlot];
  const placed = useMemo(
    () => (selectedPhoto && slot ? { photo: selectedPhoto, slot } : null),
    [selectedPhoto, slot],
  );

  return (
    <ImageBackground source={BACKDROP} style={styles.canvas} testID="wall-screen">
      <SelectCatcher onSelect={commands.select} />

      <WallCollage
        wall={wall}
        selectedSlot={selectedSlot}
        selection={spotlight ? null : placed}
        onSettled={settle}
      />
      <TopBar total={wall.stats.total} status={status} />
      <NowShowingBar
        photo={selectedPhoto}
        position={director.position}
        total={director.total}
        durationMs={director.durationMs}
        cycleKey={director.cycleKey}
        paused={director.paused}
      />
      <JoinPanel stats={wall.stats} attention={filledSlots.length === 0} />
      <SourceCard />
      <Spotlight
        selection={spotlight ? placed : null}
        position={director.position}
        total={director.total}
        durationMs={director.durationMs}
        cycleKey={director.cycleKey}
        paused={director.paused}
      />
      <IncomingToast photo={director.nextUpPhoto} />
      <ConnectingOverlay phase={connection.phase} attempts={connection.attempts} />
      <ExitHint visible={exitArmed} />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  canvas: {
    backgroundColor: color.canvas,
    flex: 1,
  },
});
