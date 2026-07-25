import { Inject, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service.js';
import { CreateConversationDto, SendMessageDto } from './dto/messaging.dto.js';
import axios from 'axios';

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);
  private readonly analyticsServiceBaseUrl: string;
  private readonly userServiceBaseUrl: string;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {
    this.analyticsServiceBaseUrl = this.configService.get<string>(
      'ANALYTICS_SERVICE_URL',
      'http://analytics-service:3040'
    );
    this.userServiceBaseUrl = this.configService.get<string>(
      'USER_SERVICE_URL',
      'http://user-service:3001'
    );
  }

  private async trackAnalyticsEvent(
    eventName: string,
    userId: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    try {
      await axios.post(
        `${this.analyticsServiceBaseUrl}/analytics/track`,
        { eventName, userId, metadata, timestamp: new Date().toISOString() },
        { timeout: 10000 }
      );
    } catch (_error) {
      this.logger.warn(`Failed to track analytics event: ${eventName}`);
    }
  }

  private async getUserProfiles(
    userIds: string[]
  ): Promise<Map<string, { displayName: string; avatar: string | null }>> {
    const profileMap = new Map<string, { displayName: string; avatar: string | null }>();
    if (userIds.length === 0) return profileMap;

    try {
      const response = await axios.get(`${this.userServiceBaseUrl}/users/batch`, {
        params: { ids: userIds.join(',') },
        timeout: 5000,
        headers: { 'x-internal-api-key': this.configService.get<string>('INTERNAL_API_KEY', '') },
      });
      const users = response.data?.data || response.data || [];
      for (const user of users) {
        profileMap.set(user.id, {
          displayName: user.displayName || user.name || 'Unknown',
          avatar: user.avatar || null,
        });
      }
    } catch (error) {
      this.logger.warn(`Failed to fetch user profiles: ${(error as Error).message}`);
    }

    return profileMap;
  }

  async getConversations(userId: string) {
    try {
      const conversations = await this.prisma.conversation.findMany({
        where: {
          participants: {
            some: {
              userId,
            },
          },
        },
        include: {
          participants: true,
          messages: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      const conversationIds = conversations.map((c) => c.id);

      const unreadCounts = await this.prisma.message.groupBy({
        by: ['conversationId'],
        where: {
          conversationId: { in: conversationIds },
          isRead: false,
          senderId: { not: userId },
        },
        _count: { id: true },
      });

      const unreadMap = new Map(unreadCounts.map((uc) => [uc.conversationId, uc._count.id]));

      // Enrich participant profiles from user-service
      const allParticipantIds = [
        ...new Set(conversations.flatMap((c) => c.participants.map((p) => p.userId))),
      ];
      const profileMap = await this.getUserProfiles(allParticipantIds);

      return {
        success: true,
        data: conversations.map((conv) => ({
          id: conv.id,
          type: conv.type,
          name: conv.name,
          avatar: conv.avatar,
          lastMessage: conv.messages[0]?.content || null,
          lastMessageAt: conv.messages[0]?.createdAt || null,
          unreadCount: unreadMap.get(conv.id) || 0,
          participants: conv.participants.map((p) => ({
            id: p.userId,
            displayName: profileMap.get(p.userId)?.displayName || null,
            avatar: profileMap.get(p.userId)?.avatar || null,
          })),
          createdAt: conv.createdAt.toISOString(),
          updatedAt: conv.updatedAt.toISOString(),
        })),
      };
    } catch (error) {
      this.logger.error(
        `getConversations failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return { success: false, error: (error as Error).message };
    }
  }

  async getMessages(userId: string, conversationId: string, limit = 50, offset = 0) {
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {
            userId,
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    try {
      const messages = await this.prisma.message.findMany({
        where: {
          conversationId,
        },
        orderBy: {
          createdAt: 'asc',
        },
        skip: offset,
        take: safeLimit,
      });

      return {
        success: true,
        data: messages.map((msg) => ({
          id: msg.id,
          conversationId: msg.conversationId,
          senderId: msg.senderId,
          content: msg.content,
          type: msg.type,
          isRead: msg.isRead,
          createdAt: msg.createdAt.toISOString(),
        })),
      };
    } catch (error) {
      this.logger.error(`getMessages failed: ${(error as Error).message}`, (error as Error).stack);
      return { success: false, error: (error as Error).message };
    }
  }

  async createConversation(userId: string, dto: CreateConversationDto) {
    try {
      const conversation = await this.prisma.conversation.create({
        data: {
          type: dto.type || 'direct',
          name: dto.name,
          participants: {
            create: [
              { userId, role: 'admin' },
              ...dto.participantIds
                .filter((id) => id !== userId)
                .map((id) => ({ userId: id, role: 'member' })),
            ],
          },
        },
        include: {
          participants: true,
        },
      });

      this.logger.log(`Conversation ${conversation.id} created by user ${userId}`);

      this.trackAnalyticsEvent('conversation_created', userId, {
        participantCount: conversation.participants.length,
      });

      return {
        success: true,
        data: {
          id: conversation.id,
          type: conversation.type,
          name: conversation.name,
          createdAt: conversation.createdAt.toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(
        `createConversation failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return { success: false, error: (error as Error).message };
    }
  }

  async sendMessage(userId: string, conversationId: string, dto: SendMessageDto) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {
            userId,
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    try {
      const message = await this.prisma.message.create({
        data: {
          conversationId,
          senderId: userId,
          content: dto.content,
          type: dto.type || 'text',
        },
      });

      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      this.trackAnalyticsEvent('message_sent', userId, { conversationId });

      return {
        success: true,
        data: {
          id: message.id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          content: message.content,
          type: message.type,
          createdAt: message.createdAt.toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(`sendMessage failed: ${(error as Error).message}`, (error as Error).stack);
      return { success: false, error: (error as Error).message };
    }
  }

  async markAsRead(userId: string, conversationId: string, messageId: string) {
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId,
      },
    });

    if (!participant) {
      throw new NotFoundException('Conversation not found');
    }

    const message = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        conversationId,
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    try {
      await this.prisma.message.update({
        where: { id: messageId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      await this.prisma.conversationParticipant.updateMany({
        where: {
          conversationId,
          userId,
        },
        data: {
          lastReadAt: new Date(),
        },
      });

      return {
        success: true,
        message: 'Message marked as read',
      };
    } catch (error) {
      this.logger.error(`markAsRead failed: ${(error as Error).message}`, (error as Error).stack);
      return { success: false, error: (error as Error).message };
    }
  }

  async deleteConversation(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {
            userId,
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    try {
      await this.prisma.conversationParticipant.delete({
        where: {
          conversationId_userId: { conversationId, userId },
        },
      });

      this.logger.log(`Conversation ${conversationId} deleted by user ${userId}`);

      return {
        success: true,
        message: 'Conversation deleted',
      };
    } catch (error) {
      this.logger.error(
        `deleteConversation failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return { success: false, error: (error as Error).message };
    }
  }

  // --- NEW: Conversation Management ---

  async updateConversation(
    userId: string,
    conversationId: string,
    data: { name?: string; avatar?: string }
  ) {
    try {
      const participant = await this.prisma.conversationParticipant.findFirst({
        where: { conversationId, userId, role: 'admin' },
      });
      if (!participant) return { success: false, error: 'Only admins can update conversations' };

      const updated = await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.avatar !== undefined && { avatar: data.avatar }),
        },
      });

      return { success: true, data: updated };
    } catch (error) {
      this.logger.error(`updateConversation failed: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  async addParticipant(userId: string, conversationId: string, newUserId: string) {
    try {
      const participant = await this.prisma.conversationParticipant.findFirst({
        where: { conversationId, userId },
      });
      if (!participant) return { success: false, error: 'Not a member of this conversation' };

      const existing = await this.prisma.conversationParticipant.findFirst({
        where: { conversationId, userId: newUserId },
      });
      if (existing) return { success: false, error: 'User already in conversation' };

      const added = await this.prisma.conversationParticipant.create({
        data: { conversationId, userId: newUserId, role: 'member' },
      });

      return { success: true, data: added };
    } catch (error) {
      this.logger.error(`addParticipant failed: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  async removeParticipant(userId: string, conversationId: string, removeUserId: string) {
    try {
      const participant = await this.prisma.conversationParticipant.findFirst({
        where: { conversationId, userId },
      });
      if (!participant || (participant.role !== 'admin' && userId !== removeUserId)) {
        return { success: false, error: 'Unauthorized' };
      }

      await this.prisma.conversationParticipant.deleteMany({
        where: { conversationId, userId: removeUserId },
      });

      return { success: true, message: 'Participant removed' };
    } catch (error) {
      this.logger.error(`removeParticipant failed: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  async muteConversation(_userId: string, conversationId: string, muted: boolean) {
    try {
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { isMuted: muted },
      });
      return { success: true, message: muted ? 'Conversation muted' : 'Conversation unmuted' };
    } catch (error) {
      this.logger.error(`muteConversation failed: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  async archiveConversation(_userId: string, conversationId: string, archived: boolean) {
    try {
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { isArchived: archived },
      });
      return {
        success: true,
        message: archived ? 'Conversation archived' : 'Conversation unarchived',
      };
    } catch (error) {
      this.logger.error(`archiveConversation failed: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  async searchConversations(userId: string, query: string, limit = 20) {
    try {
      const conversations = await this.prisma.conversation.findMany({
        where: {
          participants: { some: { userId } },
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { messages: { some: { content: { contains: query, mode: 'insensitive' } } } },
          ],
        },
        include: { participants: true },
        take: limit,
      });

      return { success: true, data: conversations };
    } catch (error) {
      this.logger.error(`searchConversations failed: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  // --- NEW: Message Management ---

  async editMessage(userId: string, messageId: string, content: string) {
    try {
      const message = await this.prisma.message.findUnique({ where: { id: messageId } });
      if (!message) return { success: false, error: 'Message not found' };
      if (message.senderId !== userId) return { success: false, error: 'Only sender can edit' };
      if (message.isDeleted) return { success: false, error: 'Cannot edit deleted message' };

      const updated = await this.prisma.message.update({
        where: { id: messageId },
        data: { content, isEdited: true },
      });

      return { success: true, data: updated };
    } catch (error) {
      this.logger.error(`editMessage failed: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  async deleteMessage(userId: string, messageId: string) {
    try {
      const message = await this.prisma.message.findUnique({ where: { id: messageId } });
      if (!message) return { success: false, error: 'Message not found' };
      if (message.senderId !== userId) return { success: false, error: 'Only sender can delete' };

      await this.prisma.message.update({
        where: { id: messageId },
        data: { isDeleted: true, content: 'This message has been deleted' },
      });

      return { success: true, message: 'Message deleted' };
    } catch (error) {
      this.logger.error(`deleteMessage failed: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  async pinMessage(userId: string, messageId: string, pinned: boolean) {
    try {
      const message = await this.prisma.message.findUnique({ where: { id: messageId } });
      if (!message) return { success: false, error: 'Message not found' };

      const participant = await this.prisma.conversationParticipant.findFirst({
        where: { conversationId: message.conversationId, userId, role: 'admin' },
      });
      if (!participant) return { success: false, error: 'Only admins can pin messages' };

      await this.prisma.message.update({
        where: { id: messageId },
        data: { isPinned: pinned },
      });

      return { success: true, message: pinned ? 'Message pinned' : 'Message unpinned' };
    } catch (error) {
      this.logger.error(`pinMessage failed: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  async searchMessages(userId: string, query: string, limit = 20) {
    try {
      const messages = await this.prisma.message.findMany({
        where: {
          content: { contains: query, mode: 'insensitive' },
          conversation: { participants: { some: { userId } } },
        },
        include: { conversation: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return { success: true, data: messages };
    } catch (error) {
      this.logger.error(`searchMessages failed: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  async addReaction(userId: string, messageId: string, emoji: string) {
    try {
      const existing = await this.prisma.messageReaction.findFirst({
        where: { messageId, userId, emoji },
      });

      if (existing) {
        await this.prisma.messageReaction.delete({ where: { id: existing.id } });
        return { success: true, message: 'Reaction removed' };
      }

      await this.prisma.messageReaction.create({
        data: { messageId, userId, emoji },
      });

      return { success: true, message: 'Reaction added' };
    } catch (error) {
      this.logger.error(`addReaction failed: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  async getReactions(messageId: string) {
    try {
      const reactions = await this.prisma.messageReaction.groupBy({
        by: ['emoji'],
        where: { messageId },
        _count: { id: true },
      });

      return { success: true, data: reactions };
    } catch (error) {
      this.logger.error(`getReactions failed: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  async replyToMessage(userId: string, conversationId: string, replyToId: string, content: string) {
    try {
      const parentMessage = await this.prisma.message.findUnique({ where: { id: replyToId } });
      if (!parentMessage) return { success: false, error: 'Parent message not found' };
      if (parentMessage.conversationId !== conversationId)
        return { success: false, error: 'Message not in this conversation' };

      const message = await this.prisma.message.create({
        data: { conversationId, senderId: userId, content, replyToId },
      });

      return { success: true, data: message };
    } catch (error) {
      this.logger.error(`replyToMessage failed: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }

  async getThread(messageId: string, limit = 50) {
    try {
      const replies = await this.prisma.message.findMany({
        where: { replyToId: messageId },
        orderBy: { createdAt: 'asc' },
        take: limit,
      });

      return { success: true, data: replies };
    } catch (error) {
      this.logger.error(`getThread failed: ${(error as Error).message}`);
      return { success: false, error: (error as Error).message };
    }
  }
}
