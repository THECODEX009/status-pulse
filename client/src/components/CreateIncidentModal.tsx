import React, { useState } from 'react';
import { Modal } from './ui/modal';
import { Button } from './ui/button';
import { MonitoredService, IncidentSeverity } from '../types';
import { api } from '../api/axios';

interface CreateIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: MonitoredService[];
  onCreated: () => void;
}

export const CreateIncidentModal: React.FC<CreateIncidentModalProps> = ({
  isOpen,
  onClose,
  services,
  onCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<IncidentSeverity>('MEDIUM');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServices.length) {
      setError('Please select at least one affected service');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/incidents', {
        title,
        description,
        severity,
        affectedServices: selectedServices,
      });
      setTitle('');
      setDescription('');
      setSelectedServices([]);
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to report incident');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report New Incident">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-lg">{error}</div>}

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Incident Title</label>
          <input
            type="text"
            required
            placeholder="e.g. Latency Spike on Payment Gateway"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Severity Level</label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
          >
            <option value="LOW">Low (Minor Impact)</option>
            <option value="MEDIUM">Medium (Partial Service Degradation)</option>
            <option value="CRITICAL">Critical (Major Outage)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Affected Services</label>
          <div className="space-y-2 max-h-36 overflow-y-auto border border-slate-800 rounded-lg p-2 bg-slate-950/50">
            {services.map((service) => (
              <label
                key={service._id}
                className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer p-1 hover:bg-slate-800/60 rounded"
              >
                <input
                  type="checkbox"
                  checked={selectedServices.includes(service._id)}
                  onChange={() => toggleService(service._id)}
                  className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-sky-500"
                />
                <span>{service.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Incident Description & Remediation Steps</label>
          <textarea
            required
            rows={3}
            placeholder="Provide detail on root cause, investigation, and impact..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" isLoading={loading}>
            Create Incident
          </Button>
        </div>
      </form>
    </Modal>
  );
};
