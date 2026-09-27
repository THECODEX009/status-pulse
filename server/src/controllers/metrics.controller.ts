import { Request, Response } from 'express';
import { calculateServiceUptime, getLatencyTrend, calculateMTTR } from '../services/metrics.service.js';
import { MonitoredService } from '../models/MonitoredService.js';
import { Incident } from '../models/Incident.js';

export const getDashboardOverview = async (req: Request, res: Response): Promise<void> => {
  const organizationId = req.user!.organizationId;

  // 1. Service count by status
  const services = await MonitoredService.find({ organizationId });
  const totalServices = services.length;
  const operationalCount = services.filter((s) => s.status === 'OPERATIONAL').length;
  const degradedCount = services.filter((s) => s.status === 'DEGRADED').length;
  const downCount = services.filter((s) => s.status === 'DOWN').length;

  // 2. Active Incidents count
  const activeIncidentsCount = await Incident.countDocuments({
    organizationId,
    status: { $ne: 'RESOLVED' },
  });

  // 3. Overall Uptime (30 days)
  const uptimeData = await calculateServiceUptime(organizationId, undefined, 30);

  // 4. MTTR
  const mttrData = await calculateMTTR(organizationId);

  // 5. Latency trend over last 24h
  const latencyTrend = await getLatencyTrend(organizationId, undefined, 24);

  res.json({
    summary: {
      totalServices,
      operationalCount,
      degradedCount,
      downCount,
      activeIncidentsCount,
      uptimePercentage: uptimeData.uptimePercentage,
      mttrMinutes: mttrData.mttrMinutes,
    },
    latencyTrend,
  });
};

export const getServiceMetrics = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const organizationId = req.user!.organizationId;

  const uptime = await calculateServiceUptime(organizationId, id, 30);
  const latencyTrend = await getLatencyTrend(organizationId, id, 24);

  res.json({
    serviceId: id,
    uptime,
    latencyTrend,
  });
};
