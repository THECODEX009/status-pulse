import http from 'http';
import { createApp } from './app.js';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';
import { initSocketGateway } from './sockets/socket.gateway.js';
import { startHealthCheckWorker } from './queues/healthCheck.worker.js';

const startServer = async () => {
  try {
    // 1. Connect MongoDB
    await connectDB();

    // 2. Create Express App & Server
    const app = createApp();
    const server = http.createServer(app);

    // 3. Initialize Socket.io Gateway
    initSocketGateway(server);

    // 4. Start BullMQ Health Check Worker
    startHealthCheckWorker();

    // 5. Start Server Listening
    server.listen(config.port, () => {
      console.log(`====================================================`);
      console.log(`🚀 StatusPulse Server running on port ${config.port}`);
      console.log(`🌐 Environment: ${config.nodeEnv}`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
