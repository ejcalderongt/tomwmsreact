import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Add JSON body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add CORS middleware for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
});

// API proxy middleware
const apiProxy = createProxyMiddleware({
  target: 'http://52.41.114.122:8097',
  changeOrigin: true,
  secure: false,
  followRedirects: true,
  timeout: 10000,
  proxyTimeout: 10000,
  pathRewrite: {
    '^/': '/api/'  // Add /api prefix since Express strips the mount path
  },
  onProxyReq: (proxyReq, req, res) => {
    // Remove problematic headers
    proxyReq.removeHeader('referer');
    proxyReq.removeHeader('origin');

    // Set proper headers for the target server
    proxyReq.setHeader('Host', '52.41.114.122:8097');
    proxyReq.setHeader('User-Agent', 'TomWMSReact/1.0');
    
    // Force HTTP protocol
    proxyReq.setHeader('X-Forwarded-Proto', 'http');
    proxyReq.setHeader('X-Forwarded-Port', '8097');

    console.log(`🟡 Proxy Request: ${req.method} ${req.url}`);
    console.log('🟡 Request Headers:', req.headers);

    // Log request body for POST requests
    if (req.method === 'POST' && req.body) {
      console.log('🟡 Request Body:', req.body);
    }
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