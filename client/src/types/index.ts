export type UserRole = 'Admin' | 'Engineer' | 'Viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
}

export type ServiceStatus = 'OPERATIONAL' | 'DEGRADED' | 'DOWN';

export interface MonitoredService {
  _id: string;
  name: string;
  url: string;
  checkIntervalSeconds: number;
  status: ServiceStatus;
  lastCheckedAt?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface HealthCheckLog {
  _id: string;
  serviceId: string;
  organizationId: string;
  statusCode: number;
  responseTimeMs: number;
  status: ServiceStatus;
  timestamp: string;
}

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'CRITICAL';
export type IncidentStatus = 'INVESTIGATING' | 'IDENTIFIED' | 'MONITORING' | 'RESOLVED';

export interface Incident {
  _id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  affectedServices: MonitoredService[] | string[];
  organizationId: string;
  createdBy: { _id: string; name: string; email: string } | string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type PlanType = 'FREE' | 'PRO' | 'ENTERPRISE';

export interface Subscription {
  _id: string;
  organizationId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  plan: PlanType;
  status: string;
  currentPeriodEnd?: string;
}

export interface LatencyTrendPoint {
  date: string;
  avgResponseTimeMs: number;
}

export interface OverviewMetrics {
  summary: {
    totalServices: number;
    operationalCount: number;
    degradedCount: number;
    downCount: number;
    activeIncidentsCount: number;
    uptimePercentage: number;
    mttrMinutes: number;
  };
  latencyTrend: LatencyTrendPoint[];
}

export interface PublicStatusResponse {
  organization: {
    name: string;
    slug: string;
  };
  systemStatus: 'ALL_SYSTEMS_OPERATIONAL' | 'PARTIAL_OUTAGE' | 'MAJOR_OUTAGE';
  overallUptimePercentage: number;
  services: MonitoredService[];
  activeIncidents: Incident[];
  recentIncidents: Incident[];
}
