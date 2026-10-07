import type { RemoteCommand } from "@vegaos-demo/shared";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { ImageBackground, StyleSheet, View } from "react-native";

import backdrop from "@/assets/brand/brand-backdrop.jpg";
import { WallCollage } from "@/features/wall/components/collage/WallCollage";
import { ConnectingOverlay } from "@/features/wall/components/overlays/ConnectingOverlay";
import { ExitHint } from "@/features/wall/components/overlays/ExitHint";
import { IncomingToast } from "@/features/wall/components/overlays/IncomingToast";
import { NowShowingBar } from "@/features/wall/components/overlays/NowShowingBar";
import { Spotlight } from "@/features/wall/components/overlays/Spotlight";
import { JoinPanel } from "@/features/wall/components/panels/JoinPanel";
import { SourceCard } from "@/features/wall/components/panels/SourceCard";
import { TopBar } from "@/features/wall/components/panels/TopBar";
import { SelectCatcher } from "@/features/wall/components/primitives/SelectCatcher";
import { SLOTS } from "@/features/wall/constants/layout";
import { type RemoteCommands, useWallDirector } from "@/features/wall/hooks/useWallDirector";
import { useWallFeed } from "@/features/wall/hooks/useWallFeed";
import { useWallRemote } from "@/features/wall/hooks/useWallRemote";
import { color } from "@/theme/tokens";

export function WallScreen() {
  // The phone remote arrives over the feed socket, before the director exists.
  const commandsRef = useRef<RemoteCommands | null>(null);
  const onRemote = useCallback((command: RemoteCommand) => commandsRef.current?.[command](), []);
  const { state: wall, status, connection, settle, rotate, show } = useWallFeed({ onRemote });
  const director = useWallDirector({ wall, rotate, show });
  const { selectedSlot, selectedPhoto, filledSlots, spotlight, commands } = director;

  useEffect(() => {
    commandsRef.current = commands;
  }, [commands]);
  const { exitArmed } = useWallRemote(commands, spotlight);

  const slot = SLOTS[selectedSlot];
  const placed = useMemo(
    () => (selectedPhoto && slot ? { photo: selectedPhoto, slot } : null),
    [selectedPhoto, slot],
  );

  return (
    <ImageBackground source={backdrop} style={styles.canvas} testID="wall-screen">
      <View style={styles.scrim} />
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
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: color.scrim,
  },
});
