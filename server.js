import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Use environment PORT or default to 5000 (configured in .replit)
const PORT = process.env.PORT || 5000;

// Add CORS middleware for all routes FIRST
app.use((req, res, next) => {
  // Allow all origins
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Allow mixed content (HTTP backend from HTTPS frontend)
  res.header('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;");
  
  // Disable cache for development
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
});

// API proxy middleware - Allows HTTP backend access from HTTPS frontend
const apiProxy = createProxyMiddleware({
  target: 'http://52.41.114.122:8097',
  changeOrigin: true,
  secure: false,
  ws: true,
  followRedirects: true,
  timeout: 30000,
  proxyTimeout: 30000,
  // Allow insecure connections (HTTP backend from HTTPS frontend)
  agent: false,
  // Keep the /api prefix that the backend expects
  pathRewrite: (path, req) => {
    // Express strips the /api mount, so we add it back
    const newPath = `/api${path}`;
    console.log(`🔀 Path rewrite: ${path} → ${newPath}`);
    return newPath;
  },
  onProxyReq: (proxyReq, req, res) => {
    // Remove headers that can cause CORS issues
    proxyReq.removeHeader('referer');
    proxyReq.removeHeader('origin');

    console.log(`🟡 Proxy Request: ${req.method} ${req.url} → ${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    const statusColor = proxyRes.statusCode >= 400 ? '🔴' : '🟢';
    console.log(`${statusColor} Proxy Response: ${proxyRes.statusCode} ${req.url}`);

    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (proxyRes.statusCode >= 400) {
      console.log('🔴 Response Headers:', proxyRes.headers);
    }
  },
  onError: (err, req, res) => {
    console.error('🔴 Proxy Error:', err.message);
    console.error('🔴 Request URL:', req.url);
    console.error('🔴 Request Method:', req.method);

    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Proxy error', 
        message: err.message,
        url: req.url 
      });
    }
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
  console.log(`🔄 API proxy configured for: http://52.41.114.122:8097`);
});