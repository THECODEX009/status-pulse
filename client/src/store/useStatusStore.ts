import { create } from 'zustand';
import { MonitoredService, Incident, ServiceStatus } from '../types';

interface StatusState {
  services: MonitoredService[];
  incidents: Incident[];
  setServices: (services: MonitoredService[]) => void;
  setIncidents: (incidents: Incident[]) => void;
  updateServiceStatus: (serviceId: string, status: ServiceStatus) => void;
  addOrUpdateIncident: (incident: Incident) => void;
}

export const useStatusStore = create<StatusState>((set) => ({
  services: [],
  incidents: [],
  setServices: (services) => set({ services }),
  setIncidents: (incidents) => set({ incidents }),
  updateServiceStatus: (serviceId, status) =>
    set((state) => ({
      services: state.services.map((s) =>
        s._id === serviceId ? { ...s, status, lastCheckedAt: new Date().toISOString() } : s
      ),
    })),
  addOrUpdateIncident: (incident) =>
    set((state) => {
      const exists = state.incidents.some((i) => i._id === incident._id);
      if (exists) {
        return {
          incidents: state.incidents.map((i) => (i._id === incident._id ? incident : i)),
        };
      }
      return { incidents: [incident, ...state.incidents] };
    }),
}));
