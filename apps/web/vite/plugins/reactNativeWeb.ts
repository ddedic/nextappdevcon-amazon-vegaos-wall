import type { Plugin } from "vite";

/**
 * Lets the shared TV wall (@boothwall/wall-ui) run in the browser. Only the lazy /wall route
 * imports React Native, so the phone page and Control panel bundles are unaffected.
 * - `react-native` resolves to react-native-web.
 * - `.web.*` files win over their native twins, the same way Metro picks platform files.
 * - `global` is the React Native name for globalThis; Animated still reads it.
 */
export function reactNativeWeb(): Plugin {
  return {
    name: "boothwall:react-native-web",
    config: () => ({
      define: { global: "globalThis" },
      resolve: {
        alias: [{ find: /^react-native$/, replacement: "react-native-web" }],
        extensions: [
          ".web.tsx",
          ".web.ts",
          ".web.js",
          ".tsx",
          ".ts",
          ".mjs",
          ".js",
          ".jsx",
          ".json",
        ],
      },
    }),
  };
}
