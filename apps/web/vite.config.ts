import { fileURLToPath } from "node:url";

import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { boothwall } from "./vite/plugins/boothwall";
import { reactNativeWeb } from "./vite/plugins/reactNativeWeb";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  plugins: [react(), tailwindcss(), cloudflare(), boothwall(), reactNativeWeb()],
});
