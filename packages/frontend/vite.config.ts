import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@social-commerce/shared": path.resolve(__dirname, "../shared/src"),
    },
  },
  server: {
    allowedHosts: ["e4c85f7eafc9.ngrok-free.app", "app.dinhviethoang604.id.vn"],
  },
});
