// vite.config.widget.ts
import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import path from "node:path";

export default defineConfig({
  plugins: [preact()],
  resolve: {
    alias: {
      "@social-commerce/shared": path.resolve(__dirname, "../shared/src"),
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/widget/main.tsx"),
      name: "LiveChatWidget",
      fileName: () => "app.js",
      formats: ["iife"],
    },
    outDir: "dist/app",
    emptyOutDir: true,
  },
});
