/**
 * The BoothWall wall, shared by the Vega TV app and the web. Nothing in here is
 * platform-specific: each app passes its remote input to WallScreen, and the few
 * React Native APIs that differ on the web have a `.web.ts` twin next to them.
 */
export {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DEMO_PHOTO_COUNT,
  parseWallEvent,
  PING_MS,
  reconnectDelayMs,
  type RemoteHandlers,
  type RemoteInputHook,
  simulatedSnapshot,
  WallErrorBoundary,
  WallScreen,
  type WallScreenProps,
  wallSocketUrl,
} from "./features/wall";
// The wall's backdrop, for apps that fill the space around the canvas with it.
export { default as WALL_BACKDROP } from "./assets/brand/backdrop.jpg";
