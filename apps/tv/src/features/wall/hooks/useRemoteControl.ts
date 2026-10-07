import { type HWEvent, useTVEventHandler } from "@amazon-devices/react-native-kepler";
import type { RemoteCommand } from "@vegaos-demo/shared";

const KEY_DOWN = 0;

type RemoteHandlers = Partial<Record<RemoteCommand, () => void>>;

/** Remotes name the same buttons differently; normalise to what the wall understands. */
const ALIASES: Record<string, RemoteCommand> = {
  enter: "select",
  center: "select",
  play_pause: "playpause",
};

/** Fires once per press: on key up, or right away for keys that report no state. */
export function useRemoteControl(handlers: RemoteHandlers) {
  useTVEventHandler((event: HWEvent) => {
    if (event.eventKeyAction === KEY_DOWN) return;
    const key = ALIASES[event.eventType] ?? (event.eventType as RemoteCommand);
    handlers[key]?.();
  });
}
