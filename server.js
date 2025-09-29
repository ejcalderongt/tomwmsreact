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
  
  // Disable cache
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
  // Keep the /api prefix that the backend expects
  pathRewrite: (path, req) => {
    // Express strips the /api mount, so we add it back
    const newPath = `/api${path}`;
    console.log(`🔀 [${new Date().toISOString()}] Path rewrite: ${path} → ${newPath}`);
    return newPath;
  },
  onProxyReq: (proxyReq, req, res) => {
    // Remove headers that can cause CORS issues
    proxyReq.removeHeader('referer');
    proxyReq.removeHeader('origin');
    proxyReq.removeHeader('host');
    
    // Set explicit headers for the backend
    proxyReq.setHeader('Accept', 'application/json');
    
    console.log(`🟡 [${new Date().toISOString()}] Proxy Request: ${req.method} ${req.url} → ${proxyReq.path}`);
    console.log(`   Headers:`, JSON.stringify(req.headers, null, 2));
  },
  onProxyRes: (proxyRes, req, res) => {
    const statusColor = proxyRes.statusCode >= 400 ? '🔴' : '🟢';
    console.log(`${statusColor} [${new Date().toISOString()}] Proxy Response: ${proxyRes.statusCode} for ${req.url}`);
    console.log(`   Response Headers:`, JSON.stringify(proxyRes.headers, null, 2));

    // Force CORS headers on response
    proxyRes.headers['access-control-allow-origin'] = '*';
    proxyRes.headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['access-control-allow-headers'] = 'Content-Type, Authorization, Accept';
  },
  onError: (err, req, res) => {
    console.error(`🔴 [${new Date().toISOString()}] Proxy Error:`, err.message);
    console.error(`   Stack:`, err.stack);
    console.error(`   Request URL:`, req.url);
    console.error(`   Request Method:`, req.method);

    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json');
      res.status(502).json({ 
        error: 'Backend proxy error', 
        message: err.message,
        details: 'Cannot connect to backend server',
        url: req.url,
        timestamp: new Date().toISOString()
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