import { Request, Response } from 'express';
import { Organization } from '../models/Organization.js';
import { MonitoredService } from '../models/MonitoredService.js';
import { Incident } from '../models/Incident.js';
import { calculateServiceUptime } from '../services/metrics.service.js';

export const getPublicStatusPage = async (req: Request, res: Response): Promise<void> => {
  const { slug } = req.params;

  const org = await Organization.findOne({ slug });
  if (!org) {
    res.status(404).json({ message: 'Status page not found' });
    return;
  }

  const services = await MonitoredService.find({ organizationId: org._id })
    .select('name url status lastCheckedAt')
    .sort({ name: 1 });

  const activeIncidents = await Incident.find({
    organizationId: org._id,
    status: { $ne: 'RESOLVED' },
  })
    .populate('affectedServices', 'name')
    .sort({ createdAt: -1 });

  const recentIncidents = await Incident.find({
    organizationId: org._id,
    status: 'RESOLVED',
  })
    .populate('affectedServices', 'name')
    .sort({ resolvedAt: -1 })
    .limit(10);

  const overallUptime = await calculateServiceUptime(org._id.toString(), undefined, 30);

  // Overall Status
  let systemStatus = 'ALL_SYSTEMS_OPERATIONAL';
  if (services.some((s) => s.status === 'DOWN')) {
    systemStatus = 'MAJOR_OUTAGE';
  } else if (services.some((s) => s.status === 'DEGRADED')) {
    systemStatus = 'PARTIAL_OUTAGE';
  }

  res.json({
    organization: {
      name: org.name,
      slug: org.slug,
    },
    systemStatus,
    overallUptimePercentage: overallUptime.uptimePercentage,
    services,
    activeIncidents,
    recentIncidents,
  });
};
