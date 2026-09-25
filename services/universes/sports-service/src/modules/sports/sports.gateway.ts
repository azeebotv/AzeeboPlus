import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

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
  namespace: '/sports',
})
export class SportsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(SportsGateway.name);

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

  handleConnection(client: Socket): void {
    const userId = client.data.userId;
    if (userId) {
      this.logger.log(`Client connected: ${client.id} (user: ${userId})`);
    } else {
      this.logger.warn(`Client connected without userId: ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
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

  @SubscribeMessage('join_match')
  handleJoinMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { matchId: string }
  ): void {
    const room = `match:${data.matchId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined match room ${room}`);
    client.emit('joined_match', { matchId: data.matchId, room });
  }

  @SubscribeMessage('leave_match')
  handleLeaveMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { matchId: string }
  ): void {
    const room = `match:${data.matchId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} left match room ${room}`);
  }

  @SubscribeMessage('join_live')
  handleJoinLive(
    @ConnectedSocket() client: Socket,
    @MessageBody() _data: Record<string, never>
  ): void {
    client.join('live_matches');
    this.logger.log(`Client ${client.id} joined live matches room`);
    client.emit('joined_live', { room: 'live_matches' });
  }

  @SubscribeMessage('leave_live')
  handleLeaveLive(
    @ConnectedSocket() client: Socket,
    @MessageBody() _data: Record<string, never>
  ): void {
    client.leave('live_matches');
  }

  broadcastScoreUpdate(matchId: string, data: unknown): void {
    const room = `match:${matchId}`;
    this.server.to(room).emit('score_update', {
      matchId,
      ...(data as object),
      timestamp: new Date().toISOString(),
    });
    this.server.to('live_matches').emit('score_update', {
      matchId,
      ...(data as object),
      timestamp: new Date().toISOString(),
    });
  }

  broadcastMatchEvent(matchId: string, event: string, data: unknown): void {
    const room = `match:${matchId}`;
    this.server.to(room).emit(event, {
      matchId,
      ...(data as object),
      timestamp: new Date().toISOString(),
    });
  }
}
