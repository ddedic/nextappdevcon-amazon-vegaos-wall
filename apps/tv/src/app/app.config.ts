export type AppConfig = {
  apiBaseUrl: string;
  /** Phone capture page that the on-screen QR code points to. */
  joinUrl: string;
  /** Upper case so QR alphanumeric mode keeps the tiny badge code scannable. */
  sourceUrl: string;
  requestTimeoutMs: number;
  simulation: { enabled: boolean; photos: number; newPhotoEveryMs: number };
};

export const appConfig: AppConfig = {
  apiBaseUrl: "https://nextapp-wall-api.dedic.dev",
  joinUrl: "https://nextapp-wall.dedic.dev",
  sourceUrl: "HTTPS://NEXTAPP-WALL.DEDIC.DEV/GH",
  requestTimeoutMs: 8000,
  // Flip to `__DEV__` (or `true`) to work on the wall without the API.
  simulation: { enabled: false, photos: 40, newPhotoEveryMs: 15_000 },
};
