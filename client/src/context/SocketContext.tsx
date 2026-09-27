import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useStatusStore } from '../store/useStatusStore';
import { useQueryClient } from '@tanstack/react-query';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, connected: false });

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const { updateServiceStatus, addOrUpdateIncident } = useStatusStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) {
      if (socket) socket.disconnect();
      setSocket(null);
      setConnected(false);
      return;
    }

    const socketInstance = io('/', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      setConnected(true);
      console.log('[Socket.io Client] Connected to server');
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
    });

    socketInstance.on('SERVICE_STATUS_CHANGED', (data) => {
      updateServiceStatus(data.serviceId, data.newStatus);
      queryClient.invalidateQueries({ queryKey: ['overview-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    });

    socketInstance.on('NEW_INCIDENT_CREATED', (incident) => {
      addOrUpdateIncident(incident);
      queryClient.invalidateQueries({ queryKey: ['overview-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    });

    socketInstance.on('INCIDENT_UPDATED', (incident) => {
      addOrUpdateIncident(incident);
      queryClient.invalidateQueries({ queryKey: ['overview-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    });

    socketInstance.on('LATENCY_METRIC_UPDATED', () => {
      queryClient.invalidateQueries({ queryKey: ['overview-metrics'] });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
