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
import { Server, Socket } from 'socket.io';
import { EngagementService } from './engagement.service.js';

@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) || [],
    credentials: true,
  },
  namespace: '/engagement',
})
export class EngagementGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(EngagementGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly engagementService: EngagementService) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      client.data.userId = userId;
      client.join(`user:${userId}`);
      this.logger.log(`Client connected: ${client.id} (user: ${userId})`);
    } else {
      this.logger.warn(`Client connected without userId: ${client.id}`);
    }
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
