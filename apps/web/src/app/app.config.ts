export const appConfig = {
  apiBaseUrl: import.meta.env.VITE_API_URL ?? "https://nextapp-wall-api.dedic.dev",
  retentionDays: 14,
  venue: "CITYCUBE Berlin",
} as const;
