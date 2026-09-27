import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/axios';
import { MonitoredService } from '../types';
import { ServiceCard } from '../components/ServiceCard';
import { Button } from '../components/ui/button';
import { CreateServiceModal } from '../components/CreateServiceModal';
import { Plus, Server } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Services: React.FC = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, refetch, isLoading } = useQuery<{ services: MonitoredService[] }>({
    queryKey: ['services'],
    queryFn: async () => {
      const res = await api.get('/services');
      return res.data;
    },
  });

  const handleManualCheck = async (id: string) => {
    try {
      await api.post(`/services/${id}/check`);
      refetch();
    } catch (err) {
      console.error('Manual health check failed:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this monitored service?')) {
      try {
        await api.delete(`/services/${id}`);
        refetch();
      } catch (err) {
        console.error('Delete service failed:', err);
      }
    }
  };

  const services = data?.services || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100">Monitored Service Endpoints</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage automated ping schedules, health checks, and HTTP latency thresholds.
          </p>
        </div>

        {user?.role !== 'Viewer' && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={16} className="mr-1.5" /> Add Monitored Service
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-500">Loading services...</div>
      ) : !services.length ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <Server size={36} className="mx-auto text-slate-600 mb-3" />
          <h3 className="font-bold text-slate-200">No Services Configured</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Get started by adding your first web service, API endpoint, or microservice for automated health checks.
          </p>
          {user?.role !== 'Viewer' && (
            <Button className="mt-4" onClick={() => setIsModalOpen(true)}>
              Add Your First Service
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <ServiceCard
              key={service._id}
              service={service}
              userRole={user?.role}
              onCheckManual={handleManualCheck}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <CreateServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={() => refetch()}
      />
    </div>
  );
};
