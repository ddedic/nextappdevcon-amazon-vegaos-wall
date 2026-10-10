/** Display options read from the wall's URL. */
export interface WallParams {
  /** `?kiosk` or `?fullscreen`: no hint, no cursor and no "Add your photo" button, ever. */
  kiosk: boolean;
  /** `?fullscreen`: go full screen on the first key press or click. */
  autoFullscreen: boolean;
  /** `?demo`: run on the bundled demo photos even when the API is live. */
  demo: boolean;
}

export function readWallParams(search: string): WallParams {
  const params = new URLSearchParams(search);
  const autoFullscreen = params.has("fullscreen");
  return {
    kiosk: autoFullscreen || params.has("kiosk"),
    autoFullscreen,
    demo: params.has("demo"),
  };
}
