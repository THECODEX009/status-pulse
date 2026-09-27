import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import routes from './routes/index.js';
import webhookRoutes from './routes/webhook.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';

export const createApp = (): Application => {
  const app = express();

  // 1. Security Headers
  app.use(helmet());

  // 2. CORS configuration
  app.use(
    cors({
      origin: config.clientOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // 3. Webhook raw body endpoint (before standard json parser)
  app.use('/api/v1/webhooks', webhookRoutes);

  // 4. Standard Body Parsers & Cookie Parser
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // 5. Rate Limiting
  app.use('/api/v1', apiRateLimiter);

  // Root info endpoint
  app.get('/', (req, res) => {
    res.json({
      name: 'StatusPulse API Server',
      version: '1.0.0',
      status: 'operational',
      documentation: '/api/v1',
      health: '/health',
      client: config.clientOrigin,
    });
  });

  // 6. Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // 7. API Routes
  app.use('/api/v1', routes);

  // 8. 404 Not Found Handler
  app.use((req, res, next) => {
    res.status(404).json({
      success: false,
      message: `Cannot ${req.method} ${req.originalUrl}. Resource not found.`,
    });
  });

  // 9. Global Error Handler
  app.use(errorHandler);

  return app;
};
