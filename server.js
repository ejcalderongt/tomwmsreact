
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// API proxy middleware
const apiProxy = createProxyMiddleware({
  target: 'http://52.41.114.122:8091',
  changeOrigin: true,
  secure: false,
  timeout: 10000,
  proxyTimeout: 10000,
  pathRewrite: {
    '^/': '/api/'  // Add /api prefix back since Express strips it
  },
  onProxyReq: (proxyReq, req, res) => {
    // Remove problematic headers
    proxyReq.removeHeader('referer');
    proxyReq.removeHeader('origin');
    console.log(`🟡 Proxy Request: ${req.method} ${req.url}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    const statusColor = proxyRes.statusCode >= 400 ? '🔴' : '🟢';
    console.log(`${statusColor} Proxy Response: ${proxyRes.statusCode} ${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('🔴 Proxy Error:', err.message);
    res.status(500).json({ error: 'Proxy error' });
  }
});

// Apply proxy middleware FIRST
app.use('/api', apiProxy);

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle client-side routing - serve index.html for all other routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Production server running on http://0.0.0.0:${PORT}`);
  console.log(`📁 Serving static files from: ${path.join(__dirname, 'dist')}`);
  console.log(`🔄 API proxy configured for: http://52.41.114.122:8091`);
});
