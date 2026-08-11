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
import { MessagingService } from './messaging.service.js';
import { FeatureFlagService, messagingFlags } from '@azeebo/feature-flags';

@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) || [],
    credentials: true,
  },
  namespace: '/messaging',
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(MessagingGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly messagingService: MessagingService,
    private readonly jwtService: JwtService,
    private readonly featureFlagService: FeatureFlagService
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

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    this.logger.log(`Client disconnected: ${client.id} (user: ${userId})`);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content: string; type?: string }
  ) {
    const userId = client.data.userId;
    if (!userId) {
      return { event: 'error', data: { message: 'Not authenticated' } };
    }

    const result = await this.messagingService.sendMessage(userId, data.conversationId, {
      content: data.content,
      type: (data.type as 'text' | 'image' | 'file') || 'text',
    });

    if (result.success) {
      this.server.to(`conversation:${data.conversationId}`).emit('new_message', result.data);
      return { event: 'message_sent', data: result.data };
    }

    return { event: 'error', data: { message: result.error } };
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string }
  ) {
    const userId = client.data.userId;
    if (!userId) {
      return { event: 'error', data: { message: 'Not authenticated' } };
    }

    const result = await this.messagingService.getMessages(userId, data.conversationId, 1);
    if (result.success) {
      client.join(`conversation:${data.conversationId}`);
      return { event: 'joined_conversation', data: { conversationId: data.conversationId } };
    }

    return { event: 'error', data: { message: 'Cannot join conversation' } };
  }

  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string }
  ) {
    client.leave(`conversation:${data.conversationId}`);
    return { event: 'left_conversation', data: { conversationId: data.conversationId } };
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; isTyping: boolean }
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    // messaging_typing_indicator: off by default — drop typing events so no
    // presence traffic reaches clients until the flag is enabled.
    if (!(await this.featureFlagService.isEnabled(messagingFlags.typingIndicator))) {
      return;
    }

    client.to(`conversation:${data.conversationId}`).emit('user_typing', {
      userId,
      conversationId: data.conversationId,
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; messageId: string }
  ) {
    const userId = client.data.userId;
    if (!userId) {
      return { event: 'error', data: { message: 'Not authenticated' } };
    }

    // messaging_read_receipts: off by default — drop read receipts so no
    // delivery-confirmation traffic reaches clients until the flag is enabled.
    if (!(await this.featureFlagService.isEnabled(messagingFlags.readReceipts))) {
      return { event: 'mark_read_success', data: { messageId: data.messageId } };
    }

    const result = await this.messagingService.markAsRead(
      userId,
      data.conversationId,
      data.messageId
    );

    if (result.success) {
      this.server.to(`conversation:${data.conversationId}`).emit('message_read', {
        userId,
        conversationId: data.conversationId,
        messageId: data.messageId,
      });
      return { event: 'mark_read_success', data: { messageId: data.messageId } };
    }

    return { event: 'error', data: { message: result.error } };
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

  broadcastToConversation(conversationId: string, event: string, data: unknown) {
    this.server.to(`conversation:${conversationId}`).emit(event, data);
  }

  sendToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }
}
