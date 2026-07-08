import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';
import { CacheService, cacheKey } from '@azeebo/shared-services';
import {
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketStatus,
} from '../ticket/dto/ticket.dto';

@Injectable()
export class TicketService {
  private readonly logger = new Logger(TicketService.name);

  constructor(
    private prisma: PrismaService,
    private readonly cache: CacheService
  ) {}

  async createTicket(data: {
    userId: string;
    category: SupportTicketCategory;
    subject: string;
    description: string;
    priority?: SupportTicketPriority;
    orderId?: string;
    metadata?: Record<string, unknown>;
  }) {
    try {
      const result = await this.prisma.supportTicket.create({
        data: {
          userId: data.userId,
          category: data.category,
          subject: data.subject,
          description: data.description,
          priority: data.priority || SupportTicketPriority.MEDIUM,
          orderId: data.orderId,
          metadata: (data.metadata || {}) as Prisma.InputJsonValue,
        },
        include: { messages: true },
      });

      await this.cache.invalidate('support:tickets:list:*');

      return result;
    } catch (error) {
      this.logger.error(`createTicket failed: ${error.message}`, error.stack);
      return { success: false, error: error.message };
    }
  }

  async getTicketById(id: string) {
    try {
      const cacheK = cacheKey('support', `tickets:${id}`);
      const cached = await this.cache.get(cacheK);
      if (cached) return cached;

      const result = await this.prisma.supportTicket.findUnique({
        where: { id },
        include: {
          messages: { orderBy: { createdAt: 'asc' } },
          refund: true,
          chargeback: true,
          appeal: true,
          takedown: true,
          dispute: true,
          suspension: true,
        },
      });

      if (result) {
        await this.cache.set(cacheK, result, 120);
      }
      return result;
    } catch (error) {
      this.logger.error(`getTicketById failed: ${error.message}`, error.stack);
      return { success: false, error: error.message };
    }
  }

  async getUserTickets(
    userId: string,
    options?: {
      status?: SupportTicketStatus;
      category?: SupportTicketCategory;
      page?: number;
      limit?: number;
    }
  ) {
    try {
      const cacheK = cacheKey('support', `tickets:list:${userId}:${JSON.stringify(options || {})}`);
      const cached = await this.cache.get(cacheK);
      if (cached) return cached;

      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const skip = (page - 1) * limit;

      const where = {
        userId,
        ...(options?.status && { status: options.status }),
        ...(options?.category && { category: options.category }),
      };

      const [tickets, total] = await Promise.all([
        this.prisma.supportTicket.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: { messages: { take: 1, orderBy: { createdAt: 'desc' } } },
        }),
        this.prisma.supportTicket.count({ where }),
      ]);

      const result = {
        tickets,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };

      await this.cache.set(cacheK, result, 120);
      return result;
    } catch (error) {
      this.logger.error(`getUserTickets failed: ${error.message}`, error.stack);
      return { success: false, error: error.message };
    }
  }

  async getTickets(options?: {
    status?: SupportTicketStatus;
    category?: SupportTicketCategory;
    assignedTo?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const cacheK = cacheKey('support', `tickets:list:${JSON.stringify(options || {})}`);
      const cached = await this.cache.get(cacheK);
      if (cached) return cached;

      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const skip = (page - 1) * limit;

      const where = {
        ...(options?.status && { status: options.status }),
        ...(options?.category && { category: options.category }),
        ...(options?.assignedTo && { assignedTo: options.assignedTo }),
      };

      const [tickets, total] = await Promise.all([
        this.prisma.supportTicket.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: { messages: { take: 1, orderBy: { createdAt: 'desc' } } },
        }),
        this.prisma.supportTicket.count({ where }),
      ]);

      const result = {
        tickets,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };

      await this.cache.set(cacheK, result, 120);
      return result;
    } catch (error) {
      this.logger.error(`getTickets failed: ${error.message}`, error.stack);
      return { success: false, error: error.message };
    }
  }

  async updateTicketStatus(id: string, status: SupportTicketStatus, assignedTo?: string) {
    try {
      const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
      if (!ticket) {
        throw new NotFoundException('Ticket not found');
      }
      const result = await this.prisma.supportTicket.update({
        where: { id },
        data: {
          status,
          ...(assignedTo && { assignedTo }),
          ...(status === SupportTicketStatus.RESOLVED && { resolvedAt: new Date() }),
        },
      });

      await this.cache.invalidate(`support:tickets:${id}`);
      await this.cache.invalidate('support:tickets:list:*');

      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`updateTicketStatus failed: ${error.message}`, error.stack);
      return { success: false, error: error.message };
    }
  }

  async addMessage(
    ticketId: string,
    senderId: string,
    senderType: 'USER' | 'ADMIN' | 'SYSTEM',
    message: string,
    isInternal = false
  ) {
    try {
      const result = await this.prisma.supportMessage.create({
        data: {
          ticketId,
          senderId,
          senderType,
          message,
          isInternal,
        },
      });

      await this.cache.invalidate(`support:tickets:${ticketId}`);

      return result;
    } catch (error) {
      this.logger.error(`addMessage failed: ${error.message}`, error.stack);
      return { success: false, error: error.message };
    }
  }

  async assignTicket(id: string, assignedTo: string) {
    try {
      const result = await this.prisma.supportTicket.update({
        where: { id },
        data: {
          assignedTo,
          status: SupportTicketStatus.IN_PROGRESS,
        },
      });

      await this.cache.invalidate(`support:tickets:${id}`);
      await this.cache.invalidate('support:tickets:list:*');

      return result;
    } catch (error) {
      this.logger.error(`assignTicket failed: ${error.message}`, error.stack);
      return { success: false, error: error.message };
    }
  }

  async escalateTicket(id: string) {
    try {
      const result = await this.prisma.supportTicket.update({
        where: { id },
        data: {
          status: SupportTicketStatus.ESCALATED,
          priority: SupportTicketPriority.HIGH,
        },
      });

      await this.cache.invalidate(`support:tickets:${id}`);
      await this.cache.invalidate('support:tickets:list:*');

      return result;
    } catch (error) {
      this.logger.error(`escalateTicket failed: ${error.message}`, error.stack);
      return { success: false, error: error.message };
    }
  }

  async closeTicket(id: string) {
    try {
      const result = await this.prisma.supportTicket.update({
        where: { id },
        data: {
          status: SupportTicketStatus.CLOSED,
          resolvedAt: new Date(),
        },
      });

      await this.cache.invalidate(`support:tickets:${id}`);
      await this.cache.invalidate('support:tickets:list:*');

      return result;
    } catch (error) {
      this.logger.error(`closeTicket failed: ${error.message}`, error.stack);
      return { success: false, error: error.message };
    }
  }

  async getFaq(category: string): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const cacheK = cacheKey('support', `faq:${category}`);
      const cached = await this.cache.get(cacheK);
      if (cached) return { success: true, data: cached };

      const articles = await this.prisma.faqArticle.findMany({
        where: { category, published: true },
        orderBy: { sortOrder: 'asc' },
      });

      await this.cache.set(cacheK, articles, 600);
      return { success: true, data: articles };
    } catch (error) {
      this.logger.error(`getFaq failed: ${error.message}`, error.stack);
      return { success: false, error: error.message };
    }
  }
}
