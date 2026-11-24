import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  body?: string;
  readAt: string | null;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

@WebSocketGateway({
  cors: {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      // Validate WebSocket origins against strict allowlist.
      if (!origin) return callback(null, true);
      const allowed = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) || [];
      if (allowed.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origin not allowed'), false);
    },
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly jwtService: JwtService) {}

  afterInit() {
    this.server.use(async (client: Socket, next) => {
      try {
        const token = this.extractToken(client);
        if (!token) {
          return next(new Error('Authentication required'));
        }

        const payload = await this.jwtService.verifyAsync(token);
        if (!payload.sub) {
          return next(new Error('Invalid token: missing sub'));
        }

        client.data.userId = payload.sub;
        next();
      } catch {
        next(new Error('Invalid or expired token'));
      }
    });
  }

  handleConnection(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      client.join(`user:${userId}`);
      this.logger.log(`Client connected: ${client.id} (user: ${userId})`);
    } else {
      this.logger.warn(`Client connected without userId: ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    this.logger.log(`Client disconnected: ${client.id} (user: ${userId})`);
  }

  /**
   * Send a real-time notification to a specific user.
   * Called by the NotificationsService when a new notification is created.
   */
  sendToUser(userId: string, notification: NotificationPayload) {
    this.server.to(`user:${userId}`).emit('new_notification', notification);
  }

  /**
   * Notify a user that their unread count changed.
   */
  sendUnreadCount(userId: string, unreadCount: number) {
    this.server.to(`user:${userId}`).emit('unread_count', { count: unreadCount });
  }

  /**
   * Notify a user that all notifications were marked as read.
   */
  sendAllRead(userId: string) {
    this.server.to(`user:${userId}`).emit('all_read');
  }

  private extractToken(client: Socket): string | null {
    const authHeader = client.handshake.auth?.token || client.handshake.headers?.authorization;
    if (typeof authHeader === 'string') {
      return authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    }
    return null;
  }
}
