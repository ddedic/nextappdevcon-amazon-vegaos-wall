import { defineConfig } from "cf/config";

/** Static SPA (no server code): the phone capture page and the booth admin page. */
export default defineConfig({
  worker: {
    name: "nextapp-wall",
    compatibilityDate: "2026-09-25",
    domains: ["nextapp-wall.dedic.dev"],
    assets: { notFoundHandling: "single-page-application" },
  },
});
