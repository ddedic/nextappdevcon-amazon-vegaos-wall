module.exports = {
  presets: ["module:@react-native/babel-preset"],
  plugins: [
    // zod v4 (via @vegaos-demo/shared) ships `export * as ns` syntax.
    "@babel/plugin-transform-export-namespace-from",
    ["module-resolver", { root: ["./src"], alias: { "@": "./src" } }],
  ],
};
