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
  namespace: '/reality',
})
export class RealityGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealityGateway.name);

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_show')
  handleJoinShow(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { showId: string }
  ): void {
    const room = `show:${data.showId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
    client.emit('joined_show', { showId: data.showId, room });
  }

  @SubscribeMessage('leave_show')
  handleLeaveShow(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { showId: string }
  ): void {
    const room = `show:${data.showId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} left room ${room}`);
    client.emit('left_show', { showId: data.showId, room });
  }

  @SubscribeMessage('new_vote')
  handleNewVote(
    @ConnectedSocket() _client: Socket,
    @MessageBody() data: { showId: string; contestantId: string; userId: string }
  ): void {
    const room = `show:${data.showId}`;
    this.server.to(room).emit('vote_update', {
      showId: data.showId,
      contestantId: data.contestantId,
      userId: data.userId,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('new_prediction')
  handleNewPrediction(
    @ConnectedSocket() _client: Socket,
    @MessageBody() data: { showId: string; userId: string; prediction: unknown }
  ): void {
    const room = `show:${data.showId}`;
    this.server.to(room).emit('prediction_update', {
      showId: data.showId,
      userId: data.userId,
      prediction: data.prediction,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('new_comment')
  handleNewComment(
    @ConnectedSocket() _client: Socket,
    @MessageBody() data: { showId: string; userId: string; content: string }
  ): void {
    const room = `show:${data.showId}`;
    this.server.to(room).emit('comment_update', {
      showId: data.showId,
      userId: data.userId,
      content: data.content,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('like_update')
  handleLikeUpdate(
    @ConnectedSocket() _client: Socket,
    @MessageBody() data: { showId: string; userId: string; liked: boolean }
  ): void {
    const room = `show:${data.showId}`;
    this.server.to(room).emit('like_update', {
      showId: data.showId,
      userId: data.userId,
      liked: data.liked,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastToRoom(room: string, event: string, data: unknown): void {
    this.server.to(room).emit(event, data);
  }
}
