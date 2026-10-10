export const CONTROL_TABS = ["queue", "photos", "remote", "overview"] as const;

export type ControlTab = (typeof CONTROL_TABS)[number];
