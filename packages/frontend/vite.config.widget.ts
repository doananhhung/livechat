import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import path from "node:path";
import { version } from "./package.json";

export default defineConfig({
  plugins: [preact()],
  resolve: {
    alias: {},
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
});
