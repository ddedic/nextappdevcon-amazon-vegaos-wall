const path = require("node:path");
const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

/**
 * Monorepo-aware Metro config: watch workspace packages (raw TS source) and
 * resolve from both the app and the hoisted root node_modules.
 * @type {import("metro-config").MetroConfig}
 */
const config = {
  watchFolders: [
    path.resolve(workspaceRoot, "packages"),
    path.resolve(workspaceRoot, "node_modules"),
  ],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, "node_modules"),
      path.resolve(workspaceRoot, "node_modules"),
    ],
    unstable_enableSymlinks: true,
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
