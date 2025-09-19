// vite.config.ts
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
    hmr: false, // Desactiva WebSocket HMR por problemas con Replit
    allowedHosts: true, // Permite todos los hosts externos
    proxy: {
      "/api": {
        target: "http://52.41.114.122:8097",
        changeOrigin: true,
        secure: false,
        ws: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
        timeout: 10000,
        proxyTimeout: 10000,
      },
    },
  },
  preview: {
    port: 5000,
    host: "0.0.0.0",
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://52.41.114.122:8097",
        changeOrigin: true,
        secure: false,
        ws: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Preview Proxy error:', err);
          });
        },
        timeout: 10000,
        proxyTimeout: 10000,
      },
    },
  },
  optimizeDeps: {
    exclude: ["react-hot-toast", "@heroicons/react"], // Previene errores MIME
  },
});
