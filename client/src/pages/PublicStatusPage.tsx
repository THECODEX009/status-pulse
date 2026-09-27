import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { api } from '../api/axios';
import { PublicStatusResponse, MonitoredService, Incident } from '../types';
import { Badge } from '../components/ui/badge';
import { Activity, ShieldCheck, AlertOctagon, CheckCircle2, Globe, Clock, Radio } from 'lucide-react';

export const PublicStatusPage: React.FC = () => {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [data, setData] = useState<PublicStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [connected, setConnected] = useState<boolean>(false);

  const fetchStatusData = async () => {
    try {
      const res = await api.get(`/status/${orgSlug}`);
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Status page not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatusData();

    // Setup public socket room listener
    const socket: Socket = io('/', {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setConnected(true);
      if (orgSlug) {
        socket.emit('join_public_room', orgSlug);
      }
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('SERVICE_STATUS_CHANGED', () => fetchStatusData());
    socket.on('NEW_INCIDENT_CREATED', () => fetchStatusData());
    socket.on('INCIDENT_UPDATED', () => fetchStatusData());

    return () => {
      socket.disconnect();
    };
  }, [orgSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-xs text-slate-400">
        Loading System Status...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <AlertOctagon size={48} className="text-rose-500 mb-3" />
        <h2 className="text-xl font-bold text-slate-100">Status Page Not Found</h2>
        <p className="text-xs text-slate-400 mt-1">{error || 'The requested organization status page does not exist.'}</p>
      </div>
    );
  }

  let statusBg = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
  let statusTitle = 'All Systems Operational';
  let StatusIcon = ShieldCheck;

  if (data.systemStatus === 'MAJOR_OUTAGE') {
    statusBg = 'bg-rose-500/10 border-rose-500/30 text-rose-400';
    statusTitle = 'Major Outage - Active Incident in Progress';
    StatusIcon = AlertOctagon;
  } else if (data.systemStatus === 'PARTIAL_OUTAGE') {
    statusBg = 'bg-amber-500/10 border-amber-500/30 text-amber-400';
    statusTitle = 'Partial Outage - Degraded Performance';
    StatusIcon = Activity;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
            <Activity size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-100">{data.organization.name}</h1>
            <p className="text-xs text-slate-400">Real-Time Infrastructure Status & Uptime Metrics</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full text-slate-400">
          <Radio size={12} className={connected ? 'text-emerald-400 animate-pulse' : 'text-slate-500'} />
          <span>{connected ? 'Live Status Sync' : 'Polling'}</span>
        </div>
      </header>

      {/* Main Status Banner */}
      <div className={`mt-6 p-6 rounded-2xl border flex items-center justify-between shadow-xl ${statusBg}`}>
        <div className="flex items-center gap-4">
          <StatusIcon size={32} className="animate-pulse" />
          <div>
            <h2 className="text-lg font-extrabold">{statusTitle}</h2>
            <p className="text-xs opacity-80 mt-0.5">
              Automated continuous health pings across regional endpoints.
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-extrabold">{data.overallUptimePercentage}%</span>
          <span className="text-[10px] block opacity-80 uppercase tracking-wider font-semibold">30-Day Uptime</span>
        </div>
      </div>

      {/* Active Incidents Banner */}
      {data.activeIncidents.length > 0 && (
        <section className="mt-8 space-y-4">
          <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
            <AlertOctagon size={16} /> Active System Incidents
          </h3>
          {data.activeIncidents.map((incident) => (
            <div key={incident._id} className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-rose-200 text-base">{incident.title}</h4>
                <Badge status={incident.status} />
              </div>
              <p className="text-xs text-rose-300 mt-2 font-mono whitespace-pre-wrap">{incident.description}</p>
              <div className="mt-3 text-[11px] text-slate-400">
                Reported on {new Date(incident.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Monitored Services List */}
      <section className="mt-8 space-y-4">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Services Status</h3>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800/80 shadow-lg">
          {data.services.map((service) => (
            <div key={service._id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe size={18} className="text-slate-500" />
                <div>
                  <span className="font-semibold text-sm text-slate-200">{service.name}</span>
                  <span className="text-[11px] text-slate-500 block font-mono">{service.url}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 hidden sm:inline">
                  {service.lastCheckedAt ? new Date(service.lastCheckedAt).toLocaleTimeString() : 'Checked'}
                </span>
                <Badge status={service.status} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Past Resolved Incidents Timeline */}
      <section className="mt-8 space-y-4 pb-12">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Past Incident History</h3>
        {!data.recentIncidents.length ? (
          <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-xl text-center text-xs text-slate-400">
            No incidents reported in the last 90 days.
          </div>
        ) : (
          <div className="space-y-3">
            {data.recentIncidents.map((incident) => (
              <div key={incident._id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-200 text-sm">{incident.title}</h4>
                  <Badge status="RESOLVED" />
                </div>
                <p className="text-xs text-slate-400 mt-2 font-mono">{incident.description}</p>
                <div className="mt-2 text-[10px] text-slate-500">
                  Resolved at: {incident.resolvedAt ? new Date(incident.resolvedAt).toLocaleString() : 'N/A'}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="py-6 border-t border-slate-800/80 text-center text-xs text-slate-500">
        Powered by <span className="font-bold text-sky-400">StatusPulse</span> SaaS Monitoring
      </footer>
    </div>
  );
};
