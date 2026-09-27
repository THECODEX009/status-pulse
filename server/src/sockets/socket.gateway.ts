import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { AuthPayload } from '../middleware/auth.js';

let io: Server | null = null;

export const initSocketGateway = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: config.clientOrigin,
      credentials: true,
    },
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
      // Allow unauthenticated connection for public status room or perform check
      return next();
    }

    try {
      const decoded = jwt.verify(token, config.jwtAccessSecret) as AuthPayload;
      socket.data.user = decoded;
      next();
    } catch (err) {
      return next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Join Organization room if authenticated
    if (socket.data.user?.organizationId) {
      const room = `org_${socket.data.user.organizationId}`;
      socket.join(room);
      console.log(`[Socket.io] Socket ${socket.id} joined room: ${room}`);
    }

    // Allow joining public status page room by org slug
    socket.on('join_public_room', (slug: string) => {
      socket.join(`public_${slug}`);
      console.log(`[Socket.io] Socket ${socket.id} joined public room: public_${slug}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io has not been initialized');
  }
  return io;
};

export const emitToOrg = (organizationId: string, event: string, data: any) => {
  if (!io) return;
  io.to(`org_${organizationId}`).emit(event, data);
};

export const emitToPublic = (orgSlug: string, event: string, data: any) => {
  if (!io) return;
  io.to(`public_${orgSlug}`).emit(event, data);
};
