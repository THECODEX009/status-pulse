import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/axios';
import { OverviewMetrics, MonitoredService, Incident } from '../types';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { LatencyChart } from '../components/LatencyChart';
import { ServiceCard } from '../components/ServiceCard';
import { IncidentTimeline } from '../components/IncidentTimeline';
import { Activity, ShieldCheck, AlertOctagon, Clock, Server, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStatusStore } from '../store/useStatusStore';
import { CreateServiceModal } from '../components/CreateServiceModal';
import { CreateIncidentModal } from '../components/CreateIncidentModal';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [isServiceModalOpen, setIsServiceModalOpen] = React.useState(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = React.useState(false);

  const { data: metrics, refetch: refetchMetrics } = useQuery<OverviewMetrics>({
    queryKey: ['overview-metrics'],
    queryFn: async () => {
      const res = await api.get('/metrics/overview');
      return res.data;
    },
    refetchInterval: 15000,
  });

  const { data: servicesData, refetch: refetchServices } = useQuery<{ services: MonitoredService[] }>({
    queryKey: ['services'],
    queryFn: async () => {
      const res = await api.get('/services');
      return res.data;
    },
  });

  const { data: incidentsData, refetch: refetchIncidents } = useQuery<{ incidents: Incident[] }>({
    queryKey: ['incidents'],
    queryFn: async () => {
      const res = await api.get('/incidents');
      return res.data;
    },
  });

  const services = servicesData?.services || [];
  const incidents = incidentsData?.incidents || [];

  const summary = metrics?.summary || {
    totalServices: 0,
    operationalCount: 0,
    degradedCount: 0,
    downCount: 0,
    activeIncidentsCount: 0,
    uptimePercentage: 100,
    mttrMinutes: 0,
  };

  // Status Banner state calculation
  let bannerBg = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
  let bannerText = 'All Systems Operational';
  let bannerIcon = ShieldCheck;

  if (summary.downCount > 0) {
    bannerBg = 'bg-rose-500/10 border-rose-500/30 text-rose-400';
    bannerText = `${summary.downCount} Service(s) Experiencing Major Outage`;
    bannerIcon = AlertOctagon;
  } else if (summary.degradedCount > 0) {
    bannerBg = 'bg-amber-500/10 border-amber-500/30 text-amber-400';
    bannerText = `${summary.degradedCount} Service(s) Experiencing Partial Degradation`;
    bannerIcon = Activity;
  }

  const BannerIcon = bannerIcon;

  return (
    <div className="space-y-6">
      {/* Top Banner Summarizing System Health */}
      <div className={`p-4 rounded-xl border flex items-center justify-between ${bannerBg}`}>
        <div className="flex items-center gap-3">
          <BannerIcon size={24} className="animate-pulse" />
          <div>
            <h3 className="font-bold text-base">{bannerText}</h3>
            <p className="text-xs opacity-80 mt-0.5">
              Live automated health checks running every 30s-60s via BullMQ + Redis worker queue.
            </p>
          </div>
        </div>

        {user?.role !== 'Viewer' && (
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setIsServiceModalOpen(true)}>
              <Plus size={14} className="mr-1" /> Add Service
            </Button>
            <Button size="sm" variant="danger" onClick={() => setIsIncidentModalOpen(true)}>
              Report Incident
            </Button>
          </div>
        )}
      </div>

      {/* Metrics Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Services</span>
            <Server size={18} className="text-sky-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-100 mt-2">{summary.totalServices}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {summary.operationalCount} operational · {summary.downCount} down
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">30-Day Uptime</span>
            <ShieldCheck size={18} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-2">
            {summary.uptimePercentage}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Aggregated across all check logs</div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Mean Time To Recovery (MTTR)</span>
            <Clock size={18} className="text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-100 mt-2">
            {summary.mttrMinutes} <span className="text-xs font-normal text-slate-400">mins</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Average incident resolution duration</div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Active Incidents</span>
            <AlertOctagon size={18} className="text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-rose-400 mt-2">
            {summary.activeIncidentsCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Requires active engineer monitoring</div>
        </Card>
      </div>

      {/* Latency Chart */}
      <LatencyChart data={metrics?.latencyTrend || []} />

      {/* Monitored Services Quick Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-100">Services Status Overview</h3>
          <span className="text-xs text-slate-400">Real-time WebSocket Sync</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <ServiceCard key={service._id} service={service} userRole={user?.role} />
          ))}
        </div>
      </div>

      {/* Recent Incident Timeline */}
      <div className="space-y-4 pt-4">
        <h3 className="text-base font-bold text-slate-100">Recent Incident Timeline</h3>
        <IncidentTimeline
          incidents={incidents.slice(0, 5)}
          userRole={user?.role}
          onIncidentUpdated={() => refetchIncidents()}
        />
      </div>

      {/* Modals */}
      <CreateServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        onCreated={() => {
          refetchServices();
          refetchMetrics();
        }}
      />

      <CreateIncidentModal
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
        services={services}
        onCreated={() => {
          refetchIncidents();
          refetchMetrics();
        }}
      />
    </div>
  );
};
