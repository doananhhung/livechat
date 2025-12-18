import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@live-chat/shared": path.resolve(__dirname, "../shared/src"),
    },
  },
  server: {
    allowedHosts: ["e4c85f7eafc9.ngrok-free.app", "app.dinhviethoang604.id.vn"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React và các dependencies core
          "react-vendor": ["react", "react-dom", "react-router-dom"],

          // UI libraries
          "ui-vendor": [
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-slot",
            "lucide-react",
          ],

          // State management & data fetching
          "state-vendor": ["@tanstack/react-query", "zustand"],

          // Form handling
          "form-vendor": ["react-hook-form"],

          // Communication
          "socket-vendor": ["socket.io-client", "axios"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    minify: "esbuild",
  },
});
