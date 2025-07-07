
import { createServer } from 'vite';

async function startServer() {
  try {
    const vite = await createServer({
      server: {
        port: 5000,
        host: '0.0.0.0'
      }
    });

    await vite.listen();
    console.log('Vite dev server running on port 5000');
  } catch (error) {
    console.error('Error starting server:', error);
  }
}

startServer();
