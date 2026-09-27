import React, { useState } from 'react';
import { Incident, IncidentStatus } from '../types';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { AlertTriangle, CheckCircle, Clock, ShieldAlert } from 'lucide-react';
import { api } from '../api/axios';

interface IncidentTimelineProps {
  incidents: Incident[];
  onIncidentUpdated?: () => void;
  userRole?: string;
}

export const IncidentTimeline: React.FC<IncidentTimelineProps> = ({
  incidents,
  onIncidentUpdated,
  userRole,
}) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<IncidentStatus>('IDENTIFIED');
  const [updateNote, setUpdateNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdateStatus = async (id: string) => {
    setLoading(true);
    try {
      await api.patch(`/incidents/${id}/status`, {
        status: newStatus,
        description: updateNote,
      });
      setUpdatingId(null);
      setUpdateNote('');
      if (onIncidentUpdated) onIncidentUpdated();
    } catch (err) {
      console.error('Failed to update incident:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!incidents.length) {
    return (
      <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-xl">
        <CheckCircle size={32} className="mx-auto text-emerald-400 mb-2 opacity-80" />
        <h4 className="font-semibold text-slate-200">No Active Incidents</h4>
        <p className="text-xs text-slate-400 mt-1">All monitored services are operating normally.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {incidents.map((incident) => {
        const isEditing = updatingId === incident._id;
        const createdByName =
          typeof incident.createdBy === 'object' ? incident.createdBy.name : 'System';

        return (
          <div
            key={incident._id}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden transition-all shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2.5 rounded-xl mt-0.5 ${
                    incident.severity === 'CRITICAL'
                      ? 'bg-rose-500/10 text-rose-400'
                      : incident.severity === 'MEDIUM'
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'bg-blue-500/10 text-blue-400'
                  }`}
                >
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-slate-100 text-base">{incident.title}</h4>
                    <Badge severity={incident.severity} />
                    <Badge status={incident.status} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Reported by <span className="text-slate-200 font-medium">{createdByName}</span> on{' '}
                    {new Date(incident.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {userRole !== 'Viewer' && !isEditing && incident.status !== 'RESOLVED' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setUpdatingId(incident._id);
                    setNewStatus(incident.status);
                  }}
                >
                  Update Status
                </Button>
              )}
            </div>

            <div className="mt-4 p-3 bg-slate-950/60 rounded-lg text-xs text-slate-300 font-mono whitespace-pre-wrap border border-slate-800/80">
              {incident.description}
            </div>

            {/* Affected Services Tags */}
            <div className="mt-3 flex items-center gap-2 flex-wrap text-xs text-slate-400">
              <span className="font-semibold text-slate-500">Affected Services:</span>
              {incident.affectedServices.map((svc: any) => (
                <span
                  key={typeof svc === 'object' ? svc._id : svc}
                  className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 text-[11px]"
                >
                  {typeof svc === 'object' ? svc.name : svc}
                </span>
              ))}
            </div>

            {/* Inline Status Update Form */}
            {isEditing && (
              <div className="mt-4 pt-4 border-t border-slate-800 space-y-3 bg-slate-950/80 p-4 rounded-xl">
                <h5 className="text-xs font-bold text-slate-200">Update Incident Lifecycle State</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">New Lifecycle Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as IncidentStatus)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                    >
                      <option value="INVESTIGATING">INVESTIGATING</option>
                      <option value="IDENTIFIED">IDENTIFIED</option>
                      <option value="MONITORING">MONITORING</option>
                      <option value="RESOLVED">RESOLVED</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Status Note / Update Message</label>
                    <input
                      type="text"
                      placeholder="e.g. Deployed fix, monitoring latency"
                      value={updateNote}
                      onChange={(e) => setUpdateNote(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setUpdatingId(null)}>
                    Cancel
                  </Button>
                  <Button size="sm" isLoading={loading} onClick={() => handleUpdateStatus(incident._id)}>
                    Save Update
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
