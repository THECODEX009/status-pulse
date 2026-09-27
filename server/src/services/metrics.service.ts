import mongoose, { Types } from 'mongoose';
import { HealthCheckLog } from '../models/HealthCheckLog.js';
import { Incident } from '../models/Incident.js';

export interface UptimeResult {
  serviceId?: string;
  totalChecks: number;
  successfulChecks: number;
  uptimePercentage: number;
}

export interface LatencyPoint {
  date: string;
  avgResponseTimeMs: number;
}

export const calculateServiceUptime = async (
  organizationId: string,
  serviceId?: string,
  days = 30
): Promise<UptimeResult> => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const matchQuery: any = {
    organizationId: new Types.ObjectId(organizationId),
    timestamp: { $gte: startDate },
  };

  if (serviceId) {
    matchQuery.serviceId = new Types.ObjectId(serviceId);
  }

  const aggregation = await HealthCheckLog.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalChecks: { $sum: 1 },
        successfulChecks: {
          $sum: {
            $cond: [{ $eq: ['$status', 'OPERATIONAL'] }, 1, 0],
          },
        },
      },
    },
  ]);

  if (!aggregation.length || aggregation[0].totalChecks === 0) {
    return {
      serviceId,
      totalChecks: 0,
      successfulChecks: 0,
      uptimePercentage: 100.0,
    };
  }

  const { totalChecks, successfulChecks } = aggregation[0];
  const uptimePercentage = parseFloat(((successfulChecks / totalChecks) * 100).toFixed(2));

  return {
    serviceId,
    totalChecks,
    successfulChecks,
    uptimePercentage,
  };
};

export const getLatencyTrend = async (
  organizationId: string,
  serviceId?: string,
  hours = 24
): Promise<LatencyPoint[]> => {
  const startDate = new Date();
  startDate.setHours(startDate.getHours() - hours);

  const matchQuery: any = {
    organizationId: new Types.ObjectId(organizationId),
    timestamp: { $gte: startDate },
  };

  if (serviceId) {
    matchQuery.serviceId = new Types.ObjectId(serviceId);
  }

  const result = await HealthCheckLog.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d %H:00', date: '$timestamp' },
        },
        avgResponseTimeMs: { $avg: '$responseTimeMs' },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        date: '$_id',
        avgResponseTimeMs: { $round: ['$avgResponseTimeMs', 2] },
      },
    },
  ]);

  return result;
};

export const calculateMTTR = async (organizationId: string): Promise<{ mttrMinutes: number; totalResolvedIncidents: number }> => {
  const resolvedIncidents = await Incident.aggregate([
    {
      $match: {
        organizationId: new Types.ObjectId(organizationId),
        status: 'RESOLVED',
        resolvedAt: { $exists: true },
      },
    },
    {
      $project: {
        durationMs: { $subtract: ['$resolvedAt', '$createdAt'] },
      },
    },
    {
      $group: {
        _id: null,
        avgDurationMs: { $avg: '$durationMs' },
        totalCount: { $sum: 1 },
      },
    },
  ]);

  if (!resolvedIncidents.length) {
    return { mttrMinutes: 0, totalResolvedIncidents: 0 };
  }

  const avgDurationMs = resolvedIncidents[0].avgDurationMs;
  const mttrMinutes = parseFloat((avgDurationMs / (1000 * 60)).toFixed(2));

  return {
    mttrMinutes,
    totalResolvedIncidents: resolvedIncidents[0].totalCount,
  };
};
