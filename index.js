
const express = require('express');
const path = require('path');
const { createServer } = require('vite');

const app = express();
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Create Vite development server
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    
    // Use Vite's connect instance as middleware
    app.use(vite.ssrFixStacktrace);
    app.use(vite.middlewares);
    
    // Serve static files from public directory
    app.use(express.static(path.join(__dirname, 'public')));
    
    // Handle all routes - let React Router handle client-side routing
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Access your app at: http://localhost:${PORT}`);
    });
    
  } catch (error) {
    console.error('Error starting server:', error);
    
    // Fallback: simple static server
    app.use(express.static(path.join(__dirname, 'public')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Fallback server running on port ${PORT}`);
    });
  }
}

startServer();
