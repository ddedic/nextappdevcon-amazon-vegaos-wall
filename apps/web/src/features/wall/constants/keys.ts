import type { RemoteCommand } from "@boothwall/shared";

/** Keyboard stand-ins for the Fire TV remote, by `KeyboardEvent.key`. */
export const KEY_COMMANDS: Record<string, RemoteCommand> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  Enter: "select",
  " ": "playpause",
  Escape: "back",
  Backspace: "back",
};
