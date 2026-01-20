/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import preact from "@preact/preset-vite";
import path from "node:path";
import { version } from "./package.json";

export default defineConfig({
  plugins: [preact()],
  resolve: {
    alias: [
      { find: "react", replacement: "preact/compat" },
      { find: "react-dom/test-utils", replacement: "preact/test-utils" },
      { find: "react-dom", replacement: "preact/compat" },
      { find: "react/jsx-runtime", replacement: "preact/jsx-runtime" },
    ],
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/widget/main.tsx"),
      name: "LiveChatWidget",
      fileName: () => `app.${version}.js`,
      formats: ["iife"],
    },
    outDir: "dist/app",
    emptyOutDir: true,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./vitest.setup.widget.ts",
    // Ensure we only run widget tests with this config
    include: ["src/widget/**/*.{test,spec}.{ts,tsx}"],
  },
});
