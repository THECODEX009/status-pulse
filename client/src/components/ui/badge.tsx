import React from 'react';
import { ServiceStatus, IncidentSeverity, IncidentStatus } from '../../types';

interface BadgeProps {
  status?: ServiceStatus | IncidentStatus;
  severity?: IncidentSeverity;
  label?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, severity, label }) => {
  let color = 'bg-slate-800 text-slate-300 border-slate-700';

  if (status === 'OPERATIONAL' || status === 'RESOLVED') {
    color = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  } else if (status === 'DEGRADED' || status === 'MONITORING' || status === 'IDENTIFIED') {
    color = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  } else if (status === 'DOWN' || status === 'INVESTIGATING') {
    color = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  }

  if (severity === 'LOW') {
    color = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
  } else if (severity === 'MEDIUM') {
    color = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  } else if (severity === 'CRITICAL') {
    color = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${color}`}
    >
      <span className="w-1.5 h-1.5 rounded-full fill-current bg-current animate-pulse" />
      {label || status || severity}
    </span>
  );
};
