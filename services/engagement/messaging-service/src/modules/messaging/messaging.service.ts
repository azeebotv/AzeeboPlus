import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateConversationDto, SendMessageDto } from './dto/messaging.dto';

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  constructor(private readonly prisma: PrismaService) {}

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

      const unreadMap = new Map(
        unreadCounts.map((uc) => [uc.conversationId, uc._count.id])
      );

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
            displayName: null,
            avatar: null,
          })),
          createdAt: conv.createdAt.toISOString(),
          updatedAt: conv.updatedAt.toISOString(),
        })),
      };
    } catch (error) {
      this.logger.error(`getConversations failed: ${error.message}`, error.stack);
      return { success: false, error: error.message };
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
      this.logger.error(`getMessages failed: ${error.message}`, error.stack);
      return { success: false, error: error.message };
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
      this.logger.error(`createConversation failed: ${error.message}`, error.stack);
      return { success: false, error: error.message };
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
      this.logger.error(`sendMessage failed: ${error.message}`, error.stack);
      return { success: false, error: error.message };
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
      this.logger.error(`markAsRead failed: ${error.message}`, error.stack);
      return { success: false, error: error.message };
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
      this.logger.error(`deleteConversation failed: ${error.message}`, error.stack);
      return { success: false, error: error.message };
    }
  }
}
