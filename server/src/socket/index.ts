// server/src/socket/index.ts

import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../utils/logger';

interface AuthenticatedSocket {
  userId: string;
}

export const initializeSocketIO = (io: SocketIOServer) => {
  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };
      (socket as any).userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = (socket as any).userId;
    logger.info(`User connected: ${userId}`);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Handle joining course rooms
    socket.on('join:course', (courseId: string) => {
      socket.join(`course:${courseId}`);
      logger.info(`User ${userId} joined course ${courseId}`);
    });

    socket.on('leave:course', (courseId: string) => {
      socket.leave(`course:${courseId}`);
      logger.info(`User ${userId} left course ${courseId}`);
    });

    // Handle joining lesson rooms
    socket.on('join:lesson', (lessonId: string) => {
      socket.join(`lesson:${lessonId}`);
      logger.info(`User ${userId} joined lesson ${lessonId}`);
    });

    socket.on('leave:lesson', (lessonId: string) => {
      socket.leave(`lesson:${lessonId}`);
      logger.info(`User ${userId} left lesson ${lessonId}`);
    });

    // Handle comments
    socket.on('comment:new', (data: { lessonId: string; comment: any }) => {
      io.to(`lesson:${data.lessonId}`).emit('comment:created', data.comment);
    });

    // Handle typing indicators
    socket.on('comment:typing', (data: { lessonId: string }) => {
      socket.to(`lesson:${data.lessonId}`).emit('user:typing', { userId });
    });

    // Handle progress updates
    socket.on('progress:update', (data: { lessonId: string; progress: number }) => {
      socket.to(`user:${userId}`).emit('progress:updated', data);
    });

    // Handle notifications
    socket.on('notification:read', (notificationId: string) => {
      socket.to(`user:${userId}`).emit('notification:marked-read', notificationId);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${userId}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${userId}:`, error);
    });
  });

  return io;
};

// Helper function to emit to specific user
export const emitToUser = (io: SocketIOServer, userId: string, event: string, data: any) => {
  io.to(`user:${userId}`).emit(event, data);
};

// Helper function to emit to course room
export const emitToCourse = (io: SocketIOServer, courseId: string, event: string, data: any) => {
  io.to(`course:${courseId}`).emit(event, data);
};

// Helper function to emit to lesson room
export const emitToLesson = (io: SocketIOServer, lessonId: string, event: string, data: any) => {
  io.to(`lesson:${lessonId}`).emit(event, data);
};
