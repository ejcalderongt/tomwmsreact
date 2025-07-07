import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5000,
    host: "0.0.0.0",
    allowedHosts: [
      "1da7a6d0-45be-4c44-bd76-6384ef21d0f0-00-1zyv481h72tzi.riker.replit.dev",
    ],
  },
});
