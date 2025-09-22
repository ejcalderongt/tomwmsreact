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
    port: 5001,
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
            console.error('🔴 Proxy error:', err.message);
            console.error('Request URL:', req.url);
            console.error('Request method:', req.method);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Remove problematic headers that cause CORS issues
            proxyReq.removeHeader('referer');
            proxyReq.removeHeader('origin');
            
            console.log('🟡 Sending Request to Target:', req.method, req.url);
            console.log('   Headers:', JSON.stringify(req.headers, null, 2));
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            const statusColor = proxyRes.statusCode >= 400 ? '🔴' : '🟢';
            console.log(`${statusColor} Response from Target:`, proxyRes.statusCode, req.url);
            if (proxyRes.statusCode >= 400) {
              console.log('   Response Headers:', JSON.stringify(proxyRes.headers, null, 2));
            }
          });
        },
        timeout: 10000,
        proxyTimeout: 10000,
      },
    },
  },
  preview: {
    port: 5001,
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
            console.error('🔴 Preview Proxy error:', err.message);
            console.error('Request URL:', req.url);
            console.error('Request method:', req.method);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Remove problematic headers that cause CORS issues
            proxyReq.removeHeader('referer');
            proxyReq.removeHeader('origin');
            
            console.log('🟡 Preview Sending Request to Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            const statusColor = proxyRes.statusCode >= 400 ? '🔴' : '🟢';
            console.log(`${statusColor} Preview Response from Target:`, proxyRes.statusCode, req.url);
          });
        },
        timeout: 10000,
        proxyTimeout: 10000,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  optimizeDeps: {
    exclude: ["react-hot-toast", "@heroicons/react"], // Previene errores MIME
  },
});
