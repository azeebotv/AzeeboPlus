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
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) || [],
    credentials: true,
  },
  namespace: '/sports',
})
export class SportsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(SportsGateway.name);

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
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
