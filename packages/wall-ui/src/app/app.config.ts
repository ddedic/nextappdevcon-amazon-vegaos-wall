import { boothwallConfig } from "@boothwall/shared";

import { DEMO_PHOTO_COUNT } from "../features/wall/data/demoPhotos";

export type AppConfig = {
  apiBaseUrl: string;
  /** The upload page that the on-screen QR code points to. */
  joinUrl: string;
  /** Upper case so QR alphanumeric mode keeps the tiny badge code scannable. */
  sourceUrl: string;
  requestTimeoutMs: number;
  simulation: { enabled: boolean; photos: number; newPhotoEveryMs: number };
};

const { urls } = boothwallConfig;

export const appConfig: AppConfig = {
  apiBaseUrl: urls.api,
  joinUrl: `${urls.web}/snap`,
  // The web app redirects /gh to the repo; a short upper-case URL keeps the QR coarse.
  sourceUrl: `${urls.web}/GH`.toUpperCase(),
  requestTimeoutMs: 8000,
  // Demo mode (boothwall.config.ts) runs the wall on the bundled demo photos, without the API.
  // One photo per bundled image, so the first wall has no repeats.
  simulation: { enabled: boothwallConfig.demo, photos: DEMO_PHOTO_COUNT, newPhotoEveryMs: 15_000 },
};
