import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { EngagementService } from './engagement.service.js';

@WebSocketGateway({
  cors: {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      // LOW-07: Validate WebSocket origins against a strict allowlist.
      if (!origin) return callback(null, true);
      const allowed = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) || [];
      if (allowed.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origin not allowed'), false);
    },
    credentials: true,
  },
  namespace: '/engagement',
})
export class EngagementGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(EngagementGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly engagementService: EngagementService,
    private readonly jwtService: JwtService
  ) {}

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

  private extractToken(client: Socket): string | null {
    // MED-04: Removed query string token support — tokens in URLs are logged
    // in server access logs, proxy logs, and browser history.
    const authHeader = client.handshake.auth?.token || client.handshake.headers?.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    this.logger.log(`Client disconnected: ${client.id} (user: ${userId})`);
  }

  @SubscribeMessage('subscribe_leaderboard')
  handleSubscribeLeaderboard(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { timePeriod?: string; category?: string }
  ) {
    const room = `leaderboard:${data.timePeriod || 'weekly'}:${data.category || 'all'}`;
    client.join(room);
    return { event: 'subscribed', data: { room } };
  }

  @SubscribeMessage('unsubscribe_leaderboard')
  handleUnsubscribeLeaderboard(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { timePeriod?: string; category?: string }
  ) {
    const room = `leaderboard:${data.timePeriod || 'weekly'}:${data.category || 'all'}`;
    client.leave(room);
    return { event: 'unsubscribed', data: { room } };
  }

  @SubscribeMessage('get_leaderboard')
  async handleGetLeaderboard(
    @MessageBody() data: { timePeriod?: string; category?: string; limit?: number }
  ) {
    const result = await this.engagementService.getLeaderboard(
      data.timePeriod,
      data.category,
      data.limit
    );
    return { event: 'leaderboard', data: result };
  }

  @SubscribeMessage('subscribe_predictions')
  handleSubscribePredictions(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { contentId?: string }
  ) {
    const room = data.contentId ? `predictions:${data.contentId}` : 'predictions:all';
    client.join(room);
    return { event: 'subscribed', data: { room } };
  }

  broadcastLeaderboardUpdate(timePeriod: string, category: string, data: unknown) {
    const room = `leaderboard:${timePeriod}:${category}`;
    this.server.to(room).emit('leaderboard_updated', data);
  }

  broadcastPredictionUpdate(contentId: string, data: unknown) {
    this.server.to(`predictions:${contentId}`).emit('prediction_updated', data);
  }

  sendToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }
}
