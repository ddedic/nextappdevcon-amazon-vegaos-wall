import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.turbo/**",
      "**/coverage/**",
      "**/.dashboard/**",
      "**/.cloudflare/**",
      "**/.wrangler/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node } },
    plugins: { "simple-import-sort": simpleImportSort, "react-hooks": reactHooks },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "no-console": ["error", { allow: ["info", "warn", "error"] }],
    },
  },
  {
    // RN/Metro/Babel/Jest configs are CommonJS by toolchain requirement.
    files: ["**/*.config.{js,cjs,mjs}", "**/index.js"],
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    files: ["**/*.test.{ts,tsx}", "**/__tests__/**"],
    rules: { "no-console": "off" },
  },
  {
    // The shared wall runs its tests with Jest (React Native preset), not Vitest.
    files: ["packages/wall-ui/**/*.test.{ts,tsx}"],
    languageOptions: { globals: { ...globals.jest } },
  },
  {
    // The shared wall also runs in the browser: Vega-only APIs belong in apps/tv.
    files: ["packages/wall-ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@amazon-devices/*"],
              message: "Keep Vega APIs in apps/tv and pass them in (see RemoteInputHook).",
            },
          ],
        },
      ],
    },
  },
);
