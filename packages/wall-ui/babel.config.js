// Used by Jest only. Metro (TV) and Vite (web) compile this package with their own setup.
module.exports = {
  presets: ["module:@react-native/babel-preset"],
  // zod v4 (via @boothwall/shared) ships `export * as ns` syntax.
  plugins: ["@babel/plugin-transform-export-namespace-from"],
};
