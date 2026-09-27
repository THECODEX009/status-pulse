import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis.js';
import { HEALTH_CHECK_QUEUE_NAME } from './healthCheck.queue.js';
import { executeHealthCheck } from '../services/pinger.service.js';

export const startHealthCheckWorker = (): Worker | null => {
  try {
    const worker = new Worker(
      HEALTH_CHECK_QUEUE_NAME,
      async (job: Job<{ serviceId: string }>) => {
        const { serviceId } = job.data;
        await executeHealthCheck(serviceId);
      },
      {
        connection: redisConnection,
        concurrency: 10,
      }
    );

    worker.on('completed', () => {});

    worker.on('failed', (job: Job | undefined, err: Error) => {
      console.error(`[BullMQ Worker] Job ${job?.id} failed with error:`, err.message);
    });

    worker.on('error', (err: Error) => {
      // Catch connection errors without crashing process
    });

    console.log('[BullMQ Worker] Health Check Worker initialized');
    return worker;
  } catch (err: any) {
    console.warn('[BullMQ Worker] Worker deferred (Redis connection pending):', err.message);
    return null;
  }
};
