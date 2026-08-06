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
    origin: process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) || [],
    credentials: true,
  },
  namespace: '/reality',
})
export class RealityGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealityGateway.name);

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
    const authHeader = client.handshake.auth?.token || client.handshake.headers?.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    if (typeof client.handshake.query?.token === 'string') {
      return client.handshake.query.token;
    }
    return null;
  }

  @SubscribeMessage('join_show')
  handleJoinShow(@ConnectedSocket() client: Socket, @MessageBody() data: { showId: string }): void {
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
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { showId: string; contestantId: string }
  ): void {
    const userId = client.data.userId;
    if (!userId) return;
    const room = `show:${data.showId}`;
    this.server.to(room).emit('vote_update', {
      showId: data.showId,
      contestantId: data.contestantId,
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('new_prediction')
  handleNewPrediction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { showId: string; prediction: unknown }
  ): void {
    const userId = client.data.userId;
    if (!userId) return;
    const room = `show:${data.showId}`;
    this.server.to(room).emit('prediction_update', {
      showId: data.showId,
      userId,
      prediction: data.prediction,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('new_comment')
  handleNewComment(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { showId: string; content: string }
  ): void {
    const userId = client.data.userId;
    if (!userId) return;
    const room = `show:${data.showId}`;
    this.server.to(room).emit('comment_update', {
      showId: data.showId,
      userId,
      content: data.content,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('like_update')
  handleLikeUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { showId: string; liked: boolean }
  ): void {
    const userId = client.data.userId;
    if (!userId) return;
    const room = `show:${data.showId}`;
    this.server.to(room).emit('like_update', {
      showId: data.showId,
      userId,
      liked: data.liked,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('join_live_chat')
  handleJoinLiveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { showId: string; displayName: string }
  ): void {
    const userId = client.data.userId;
    if (!userId) return;
    const room = `live_chat:${data.showId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined live chat for show ${data.showId}`);
    this.server.to(room).emit('live_chat_user_joined', {
      showId: data.showId,
      userId,
      displayName: data.displayName,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('leave_live_chat')
  handleLeaveLiveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { showId: string }
  ): void {
    const userId = client.data.userId;
    if (!userId) return;
    const room = `live_chat:${data.showId}`;
    client.leave(room);
    this.server.to(room).emit('live_chat_user_left', {
      showId: data.showId,
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('live_chat_message')
  handleLiveChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { showId: string; displayName: string; message: string; avatar?: string }
  ): void {
    const userId = client.data.userId;
    if (!userId) return;
    const room = `live_chat:${data.showId}`;
    const chatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      showId: data.showId,
      userId,
      displayName: data.displayName,
      message: data.message,
      avatar: data.avatar,
      timestamp: new Date().toISOString(),
    };
    this.server.to(room).emit('live_chat_message', chatMessage);
  }

  @SubscribeMessage('live_chat_typing')
  handleLiveChatTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { showId: string; displayName: string; isTyping: boolean }
  ): void {
    const userId = client.data.userId;
    if (!userId) return;
    const room = `live_chat:${data.showId}`;
    this.server.to(room).emit('live_chat_typing', {
      showId: data.showId,
      userId,
      displayName: data.displayName,
      isTyping: data.isTyping,
    });
  }

  sendLiveChatMessage(showId: string, message: unknown): void {
    const room = `live_chat:${showId}`;
    this.server.to(room).emit('live_chat_message', message);
  }

  broadcastToRoom(room: string, event: string, data: unknown): void {
    this.server.to(room).emit(event, data);
  }
}
