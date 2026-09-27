import { MonitoredService, ServiceStatus } from '../models/MonitoredService.js';
import { HealthCheckLog } from '../models/HealthCheckLog.js';
import { emitToOrg } from '../sockets/socket.gateway.js';

export interface PingResult {
  statusCode: number;
  responseTimeMs: number;
  status: ServiceStatus;
}

export const executeHealthCheck = async (serviceId: string): Promise<PingResult | null> => {
  const service = await MonitoredService.findById(serviceId);
  if (!service) return null;

  const startTime = Date.now();
  let statusCode = 0;
  let status: ServiceStatus = 'DOWN';
  let responseTimeMs = 0;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const res = await fetch(service.url, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'User-Agent': 'StatusPulse-HealthChecker/1.0' },
    });

    clearTimeout(timeoutId);
    responseTimeMs = Date.now() - startTime;
    statusCode = res.status;

    if (res.ok) {
      status = responseTimeMs > 2000 ? 'DEGRADED' : 'OPERATIONAL';
    } else {
      status = 'DOWN';
    }
  } catch (error) {
    responseTimeMs = Date.now() - startTime;
    statusCode = 504;
    status = 'DOWN';
  }

  // 1. Log response in HealthCheckLog
  const healthLog = await HealthCheckLog.create({
    serviceId: service._id,
    organizationId: service.organizationId,
    statusCode,
    responseTimeMs,
    status,
    timestamp: new Date(),
  });

  const previousStatus = service.status;

  // 2. Update service state
  service.status = status;
  service.lastCheckedAt = new Date();
  await service.save();

  // 3. Emit real-time WebSockets event
  emitToOrg(service.organizationId.toString(), 'LATENCY_METRIC_UPDATED', {
    serviceId: service._id,
    responseTimeMs,
    statusCode,
    status,
    timestamp: healthLog.timestamp,
  });

  if (previousStatus !== status) {
    emitToOrg(service.organizationId.toString(), 'SERVICE_STATUS_CHANGED', {
      serviceId: service._id,
      name: service.name,
      previousStatus,
      newStatus: status,
      timestamp: new Date(),
    });
  }

  return { statusCode, responseTimeMs, status };
};
