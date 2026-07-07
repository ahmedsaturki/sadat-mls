import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig({
  extends: ["next/core-web-vitals", "next/next", "next/typescript"],
  ignores: [
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".agents/**",
    "scripts/**", // Allow scripts to use require
  ],
  rules: {
    // Custom overrides for scripts
    "scripts/**": {
      "no-var": "off",
      "no-restricted-imports": "off",
      "no-restricted-syntax": "off",
      "no-restricted-modules": "off",
    },
  },
  settings: {
    // Enable TypeScript parsing
    typescript: {
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
  },
});