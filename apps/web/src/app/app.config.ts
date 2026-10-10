import { boothwallConfig, EVENT } from "@boothwall/shared";

export const appConfig = {
  apiBaseUrl: import.meta.env.VITE_API_URL ?? boothwallConfig.urls.api,
  retentionDays: boothwallConfig.retentionDays,
  venue: EVENT.venue,
} as const;
