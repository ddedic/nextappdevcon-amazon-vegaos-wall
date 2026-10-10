import { type HWEvent, useTVEventHandler } from "@amazon-devices/react-native-kepler";
import type { RemoteCommand } from "@boothwall/shared";
import type { RemoteHandlers } from "@boothwall/wall-ui";

const KEY_DOWN = 0;

/** Remotes name the same buttons differently; normalise to what the wall understands. */
const ALIASES: Record<string, RemoteCommand> = {
  enter: "select",
  center: "select",
  play_pause: "playpause",
};

/** The Fire TV remote. Fires once per press: on key up, or right away for keys that report no state. */
export function useVegaRemote(handlers: RemoteHandlers) {
  useTVEventHandler((event: HWEvent) => {
    if (event.eventKeyAction === KEY_DOWN) return;
    const key = ALIASES[event.eventType] ?? (event.eventType as RemoteCommand);
    handlers[key]?.();
  });
}
