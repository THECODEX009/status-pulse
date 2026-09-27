import { Request, Response } from 'express';
import { MonitoredService } from '../models/MonitoredService.js';
import { HealthCheckLog } from '../models/HealthCheckLog.js';
import { scheduleServiceCheck, removeScheduledServiceCheck } from '../queues/healthCheck.queue.js';
import { executeHealthCheck } from '../services/pinger.service.js';

export const createService = async (req: Request, res: Response): Promise<void> => {
  const { name, url, checkIntervalSeconds } = req.body;
  const organizationId = req.user!.organizationId;

  const service = await MonitoredService.create({
    name,
    url,
    checkIntervalSeconds: checkIntervalSeconds || 60,
    organizationId,
    status: 'OPERATIONAL',
  });

  // Schedule repeatable job in BullMQ
  await scheduleServiceCheck(service._id.toString(), service.checkIntervalSeconds);

  // Trigger immediate initial health check async
  executeHealthCheck(service._id.toString()).catch(() => {});

  res.status(201).json({
    message: 'Service created successfully',
    service,
  });
};

export const getServices = async (req: Request, res: Response): Promise<void> => {
  const organizationId = req.user!.organizationId;

  const services = await MonitoredService.find({ organizationId }).sort({ createdAt: -1 });

  res.json({ services });
};

export const getServiceById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;

  const service = await MonitoredService.findOne({ _id: id, organizationId });
  if (!service) {
    res.status(404).json({ message: 'Service not found' });
    return;
  }

  // Fetch recent logs
  const recentLogs = await HealthCheckLog.find({ serviceId: id })
    .sort({ timestamp: -1 })
    .limit(50);

  res.json({ service, recentLogs });
};

export const updateService = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;

  const service = await MonitoredService.findOne({ _id: id, organizationId });
  if (!service) {
    res.status(404).json({ message: 'Service not found' });
    return;
  }

  const { name, url, checkIntervalSeconds } = req.body;

  if (name) service.name = name;
  if (url) service.url = url;

  const intervalChanged = checkIntervalSeconds && checkIntervalSeconds !== service.checkIntervalSeconds;

  if (checkIntervalSeconds) {
    service.checkIntervalSeconds = checkIntervalSeconds;
  }

  await service.save();

  if (intervalChanged) {
    await removeScheduledServiceCheck(service._id.toString());
    await scheduleServiceCheck(service._id.toString(), service.checkIntervalSeconds);
  }

  res.json({ message: 'Service updated', service });
};

export const deleteService = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;

  const service = await MonitoredService.findOneAndDelete({ _id: id, organizationId });
  if (!service) {
    res.status(404).json({ message: 'Service not found' });
    return;
  }

  // Remove scheduled job
  await removeScheduledServiceCheck(id);

  // Clean logs
  await HealthCheckLog.deleteMany({ serviceId: id });

  res.json({ message: 'Service deleted successfully' });
};

export const triggerManualCheck = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;

  const service = await MonitoredService.findOne({ _id: id, organizationId });
  if (!service) {
    res.status(404).json({ message: 'Service not found' });
    return;
  }

  const result = await executeHealthCheck(id);

  res.json({ message: 'Manual health check executed', result });
};
