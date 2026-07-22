import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getStats() {
    try {
      const totalConversations = await this.prisma.conversation.count();
      const totalMessages = await this.prisma.message.count();

      const uniqueSenders = await this.prisma.message.groupBy({
        by: ['senderId'],
      });
      const totalUniqueUsers = uniqueSenders.length;

      const totalParticipants = await this.prisma.conversationParticipant.groupBy({
        by: ['userId'],
      });
      const totalUsers = totalParticipants.length;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const messagesToday = await this.prisma.message.count({
        where: { createdAt: { gte: today } },
      });

      const conversationsToday = await this.prisma.conversation.count({
        where: { createdAt: { gte: today } },
      });

      const typeBreakdown = await this.prisma.conversation.groupBy({
        by: ['type'],
        _count: { id: true },
      });

      return {
        totalConversations,
        totalMessages,
        totalUsers,
        totalUniqueSenders,
        messagesToday,
        conversationsToday,
        byType: typeBreakdown.map((t) => ({
          type: t.type,
          count: t._count.id,
        })),
      };
    } catch (error) {
      this.logger.error(`getStats failed: ${(error as Error).message}`, (error as Error).stack);
      return { success: false, error: (error as Error).message };
    }
  }

  async getConversations(options?: { page?: number; limit?: number }) {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const skip = (page - 1) * limit;

      const [conversations, total] = await Promise.all([
        this.prisma.conversation.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            participants: true,
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        }),
        this.prisma.conversation.count(),
      ]);

      return {
        conversations: conversations.map((conv) => ({
          id: conv.id,
          type: conv.type,
          name: conv.name,
          avatar: conv.avatar,
          lastMessage: conv.messages[0]?.content || null,
          lastMessageAt: conv.messages[0]?.createdAt?.toISOString() || null,
          participantCount: conv.participants.length,
          createdAt: conv.createdAt.toISOString(),
          updatedAt: conv.updatedAt.toISOString(),
        })),
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(
        `getConversations failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return { success: false, error: (error as Error).message };
    }
  }

  async getMessages(conversationId: string, options?: { page?: number; limit?: number }) {
    try {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      const page = options?.page || 1;
      const limit = options?.limit || 50;
      const skip = (page - 1) * limit;

      const [messages, total] = await Promise.all([
        this.prisma.message.findMany({
          where: { conversationId },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.message.count({ where: { conversationId } }),
      ]);

      return {
        messages: messages.map((msg) => ({
          id: msg.id,
          conversationId: msg.conversationId,
          senderId: msg.senderId,
          content: msg.content,
          type: msg.type,
          isRead: msg.isRead,
          readAt: msg.readAt?.toISOString() || null,
          createdAt: msg.createdAt.toISOString(),
        })),
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(
        `getMessages failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }
}
