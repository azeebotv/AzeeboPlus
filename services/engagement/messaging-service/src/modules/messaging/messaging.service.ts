import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateConversationDto, SendMessageDto } from './dto/messaging.dto';

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getConversations(userId: string) {
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

    return {
      success: true,
      data: conversations.map((conv) => ({
        id: conv.id,
        type: conv.type,
        name: conv.name,
        avatar: conv.avatar,
        lastMessage: conv.messages[0]?.content || null,
        lastMessageAt: conv.messages[0]?.createdAt || null,
        unreadCount: 0,
        participants: conv.participants.map((p) => ({
          id: p.userId,
          displayName: null,
          avatar: null,
        })),
        createdAt: conv.createdAt.toISOString(),
        updatedAt: conv.updatedAt.toISOString(),
      })),
    };
  }

  async getMessages(userId: string, conversationId: string, limit = 50, offset = 0) {
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

    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
      },
      orderBy: {
        createdAt: 'asc',
      },
      skip: offset,
      take: limit,
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
  }

  async createConversation(userId: string, dto: CreateConversationDto) {
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
  }

  async markAsRead(userId: string, conversationId: string, messageId: string) {
    const message = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        conversationId,
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

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

    await this.prisma.conversation.delete({
      where: { id: conversationId },
    });

    this.logger.log(`Conversation ${conversationId} deleted by user ${userId}`);

    return {
      success: true,
      message: 'Conversation deleted',
    };
  }
}
