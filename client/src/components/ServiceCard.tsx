import React from 'react';
import { MonitoredService } from '../types';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Globe, RefreshCw, Trash2, Clock } from 'lucide-react';

interface ServiceCardProps {
  service: MonitoredService;
  onCheckManual?: (id: string) => void;
  onDelete?: (id: string) => void;
  userRole?: string;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onCheckManual,
  onDelete,
  userRole,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-800 rounded-xl text-sky-400">
            <Globe size={20} />
          </div>
          <div>
            <h4 className="font-bold text-slate-100 text-base">{service.name}</h4>
            <a
              href={service.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-slate-400 hover:text-sky-400 font-mono truncate block max-w-xs"
            >
              {service.url}
            </a>
          </div>
        </div>
        <Badge status={service.status} />
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <Clock size={14} className="text-slate-500" />
          <span>Interval: {service.checkIntervalSeconds}s</span>
        </div>
        <div>
          {service.lastCheckedAt
            ? `Last check: ${new Date(service.lastCheckedAt).toLocaleTimeString()}`
            : 'Never checked'}
        </div>
      </div>

      {(onCheckManual || onDelete) && userRole !== 'Viewer' && (
        <div className="mt-4 pt-3 border-t border-slate-800/50 flex items-center justify-end gap-2">
          {onCheckManual && (
            <Button variant="ghost" size="sm" onClick={() => onCheckManual(service._id)}>
              <RefreshCw size={14} className="mr-1.5" />
              Ping Now
            </Button>
          )}
          {onDelete && userRole === 'Admin' && (
            <Button variant="danger" size="sm" onClick={() => onDelete(service._id)}>
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
