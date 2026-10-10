import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

import { reactNativeWeb } from "./vite/plugins/reactNativeWeb";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  plugins: [react(), reactNativeWeb()],
  test: { environment: "jsdom", setupFiles: ["./src/test/setup.ts"] },
});
