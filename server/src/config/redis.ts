import { Redis } from 'ioredis';
import { config } from './env.js';

export const redisConnection = new Redis({
  host: config.redisHost,
  port: config.redisPort,
  password: config.redisPassword,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times) {
    // Retry connecting every 10s if Redis is not available locally
    return Math.min(times * 1000, 10000);
  },
});

let isRedisConnected = false;

redisConnection.on('connect', () => {
  isRedisConnected = true;
  console.log('[Redis] Connected to Redis server');
});

redisConnection.on('error', (err) => {
  if (isRedisConnected) {
    console.error('[Redis] Redis error:', err.message);
  } else {
    // Single clean line warning when Redis service is not active locally
    console.warn(`[Redis] Connection pending/offline at ${config.redisHost}:${config.redisPort}`);
  }
  isRedisConnected = false;
});
