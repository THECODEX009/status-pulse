import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/axios';
import { Incident, MonitoredService } from '../types';
import { IncidentTimeline } from '../components/IncidentTimeline';
import { Button } from '../components/ui/button';
import { CreateIncidentModal } from '../components/CreateIncidentModal';
import { AlertTriangle, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Incidents: React.FC = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: incidentsData, refetch: refetchIncidents, isLoading } = useQuery<{ incidents: Incident[] }>({
    queryKey: ['incidents'],
    queryFn: async () => {
      const res = await api.get('/incidents');
      return res.data;
    },
  });

  const { data: servicesData } = useQuery<{ services: MonitoredService[] }>({
    queryKey: ['services'],
    queryFn: async () => {
      const res = await api.get('/services');
      return res.data;
    },
  });

  const incidents = incidentsData?.incidents || [];
  const services = servicesData?.services || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100">Incident & Audit Logging</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Track outage lifecycles (Investigating, Identified, Monitoring, Resolved).
          </p>
        </div>

        {user?.role !== 'Viewer' && (
          <Button variant="danger" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} className="mr-1.5" /> Report New Incident
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-500">Loading incident records...</div>
      ) : (
        <IncidentTimeline
          incidents={incidents}
          userRole={user?.role}
          onIncidentUpdated={() => refetchIncidents()}
        />
      )}

      <CreateIncidentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        services={services}
        onCreated={() => refetchIncidents()}
      />
    </div>
  );
};
