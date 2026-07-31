import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '../../prisma/client/index.js';
import { CacheService, cacheKey } from '@azeebo/shared-services';
import axios from 'axios';
import {
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketStatus,
} from '../ticket/dto/ticket.dto';

@Injectable()
export class TicketService {
  private readonly logger = new Logger(TicketService.name);
  private readonly analyticsServiceBaseUrl: string;

  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(CacheService) private readonly cache: CacheService,
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {
    this.analyticsServiceBaseUrl = this.configService.get<string>(
      'ANALYTICS_SERVICE_URL',
      'http://analytics-service:3040'
    );
  }

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

      this.trackAnalyticsEvent('support_ticket_created', data.userId, {
        ticketId: result.id,
        category: data.category,
      });
      return result;
    } catch (error) {
      this.logger.error(`createTicket failed: ${(error as Error).message}`, (error as Error).stack);
      return { success: false, error: (error as Error).message };
    }
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
    } catch (error) {
      this.logger.warn(`Failed to track analytics event: ${eventName}`);
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
      this.logger.error(
        `getTicketById failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return { success: false, error: (error as Error).message };
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
  ): Promise<
    | {
        tickets: unknown[];
        meta: { page: number; limit: number; total: number; totalPages: number };
      }
    | { success: boolean; error: string }
  > {
    try {
      const cacheK = cacheKey('support', `tickets:list:${userId}:${JSON.stringify(options || {})}`);
      const cached = await this.cache.get<{
        tickets: unknown[];
        meta: { page: number; limit: number; total: number; totalPages: number };
      }>(cacheK);
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
      this.logger.error(
        `getUserTickets failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return { success: false, error: (error as Error).message };
    }
  }

  async getTickets(options?: {
    status?: SupportTicketStatus;
    category?: SupportTicketCategory;
    assignedTo?: string;
    page?: number;
    limit?: number;
  }): Promise<
    | {
        tickets: unknown[];
        meta: { page: number; limit: number; total: number; totalPages: number };
      }
    | { success: boolean; error: string }
  > {
    try {
      const cacheK = cacheKey('support', `tickets:list:${JSON.stringify(options || {})}`);
      const cached = await this.cache.get<{
        tickets: unknown[];
        meta: { page: number; limit: number; total: number; totalPages: number };
      }>(cacheK);
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
      this.logger.error(`getTickets failed: ${(error as Error).message}`, (error as Error).stack);
      return { success: false, error: (error as Error).message };
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
      this.logger.error(
        `updateTicketStatus failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return { success: false, error: (error as Error).message };
    }
  }

  async addMessage(
    ticketId: string,
    senderId: string,
    senderType: 'USER' | 'AGENT' | 'SYSTEM',
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
      this.logger.error(`addMessage failed: ${(error as Error).message}`, (error as Error).stack);
      return { success: false, error: (error as Error).message };
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
      this.logger.error(`assignTicket failed: ${(error as Error).message}`, (error as Error).stack);
      return { success: false, error: (error as Error).message };
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
      this.logger.error(
        `escalateTicket failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return { success: false, error: (error as Error).message };
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
      this.logger.error(`closeTicket failed: ${(error as Error).message}`, (error as Error).stack);
      return { success: false, error: (error as Error).message };
    }
  }

  async getFaq(category: string): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const cacheK = cacheKey('support', `faq:${category}`);
      const cached = await this.cache.get(cacheK);
      if (cached) return { success: true, data: cached };

      // Seed FAQ data with common questions
      const faqData: Record<
        string,
        Array<{ id: string; question: string; answer: string; category: string }>
      > = {
        general: [
          {
            id: 'faq-1',
            question: 'What is Azeebo+?',
            answer:
              'Azeebo+ is a multi-service entertainment platform offering movies, reality TV, comedy, sports, games, and more across Africa.',
            category: 'general',
          },
          {
            id: 'faq-2',
            question: 'How do I create an account?',
            answer:
              'Download the Azeebo+ app or visit our website, click "Sign Up", and follow the registration process with your email or phone number.',
            category: 'general',
          },
          {
            id: 'faq-3',
            question: 'Is Azeebo+ available on my device?',
            answer:
              'Azeebo+ is available on iOS, Android, and web browsers. Download from the App Store or Google Play Store.',
            category: 'general',
          },
        ],
        payments: [
          {
            id: 'faq-4',
            question: 'How do I add funds to my wallet?',
            answer:
              'Go to Wallet > Add Funds, select your payment method (card, bank transfer, or USSD), and follow the prompts.',
            category: 'payments',
          },
          {
            id: 'faq-5',
            question: 'What payment methods are accepted?',
            answer:
              'We accept debit/credit cards, bank transfers, USSD payments, and mobile money through Paystack and Flutterwave.',
            category: 'payments',
          },
          {
            id: 'faq-6',
            question: 'How do I request a refund?',
            answer:
              'Contact our support team through the Help & Support section with your transaction details. Refunds are processed within 5-7 business days.',
            category: 'payments',
          },
        ],
        content: [
          {
            id: 'faq-7',
            question: 'How do I become a creator?',
            answer:
              'Apply through the Creator Portal on our website. You need to verify your identity and agree to our creator terms.',
            category: 'content',
          },
          {
            id: 'faq-8',
            question: 'How do I report inappropriate content?',
            answer:
              'Click the three-dot menu on any content and select "Report". Choose the reason and submit. Our moderation team will review within 24 hours.',
            category: 'content',
          },
          {
            id: 'faq-9',
            question: 'Can I download content for offline viewing?',
            answer:
              'Premium subscribers can download select content for offline viewing. Look for the download icon on supported content.',
            category: 'content',
          },
        ],
        account: [
          {
            id: 'faq-10',
            question: 'How do I change my password?',
            answer:
              'Go to Settings > Security > Change Password. Enter your current password and new password to update.',
            category: 'account',
          },
          {
            id: 'faq-11',
            question: 'How do I delete my account?',
            answer:
              'Go to Settings > Account > Delete Account. This action is irreversible and will remove all your data within 30 days.',
            category: 'account',
          },
          {
            id: 'faq-12',
            question: 'How do I enable two-factor authentication?',
            answer:
              'Go to Settings > Security > Two-Factor Authentication and follow the setup instructions.',
            category: 'account',
          },
        ],
      };

      const articles =
        category && category !== 'all' ? faqData[category] || [] : Object.values(faqData).flat();

      await this.cache.set(cacheK, articles, 600);
      return { success: true, data: articles };
    } catch (error) {
      this.logger.error(`getFaq failed: ${(error as Error).message}`, (error as Error).stack);
      return { success: false, error: (error as Error).message };
    }
  }
}
