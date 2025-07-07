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
    strictPort: true,
    allowedHosts: "all",
    hmr: {
      port: 5000,
      host: "0.0.0.0"
    },
    proxy: {
      "/api": {
        target: "http://52.41.114.122:8091",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
