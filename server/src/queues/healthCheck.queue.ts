import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis.js';

export const HEALTH_CHECK_QUEUE_NAME = 'health-check-queue';

export const healthCheckQueue = new Queue(HEALTH_CHECK_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 500,
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

export const scheduleServiceCheck = async (serviceId: string, intervalSeconds: number) => {
  try {
    await healthCheckQueue.add(
      'ping-service',
      { serviceId },
      {
        repeat: {
          every: intervalSeconds * 1000,
        },
        jobId: `ping_${serviceId}`,
      }
    );
  } catch (err: any) {
    console.warn(`[BullMQ Queue] Could not schedule job for ${serviceId} (Redis offline):`, err.message);
  }
};

export const removeScheduledServiceCheck = async (serviceId: string) => {
  try {
    const repeatableJobs = await healthCheckQueue.getRepeatableJobs();
    const job = repeatableJobs.find(
      (j) => j.id === `ping_${serviceId}` || (j.name === 'ping-service' && j.id?.includes(serviceId))
    );
    if (job) {
      await healthCheckQueue.removeRepeatableByKey(job.key);
    }
  } catch (err: any) {
    console.warn(`[BullMQ Queue] Could not remove scheduled job for ${serviceId}:`, err.message);
  }
};
