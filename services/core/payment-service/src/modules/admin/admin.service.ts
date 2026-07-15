import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async getPayments(options?: { page?: number; limit?: number; status?: string }) {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const skip = (page - 1) * limit;
      const where = options?.status ? { status: options.status } : {};

      const [payments, total] = await Promise.all([
        this.prisma.payment.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.payment.count({ where }),
      ]);

      return {
        payments,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to get payments: ${error}`);
      return {
        success: false,
        error: { code: 'GET_PAYMENTS_FAILED', message: 'Failed to retrieve payments' },
      };
    }
  }

  async getPaymentById(paymentId: string) {
    try {
      const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
      if (!payment) {
        throw new NotFoundException('Payment not found');
      }
      return payment;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to get payment by id: ${error}`);
      return {
        success: false,
        error: { code: 'GET_PAYMENT_FAILED', message: 'Failed to retrieve payment' },
      };
    }
  }

  async getPaymentIntents(options?: { page?: number; limit?: number; status?: string }) {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const skip = (page - 1) * limit;
      const where = options?.status ? { status: options.status } : {};

      const [intents, total] = await Promise.all([
        this.prisma.paymentIntent.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: { refunds: true },
        }),
        this.prisma.paymentIntent.count({ where }),
      ]);

      return {
        intents,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to get payment intents: ${error}`);
      return {
        success: false,
        error: { code: 'GET_INTENTS_FAILED', message: 'Failed to retrieve payment intents' },
      };
    }
  }

  async getRefunds(options?: { page?: number; limit?: number; status?: string }) {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const skip = (page - 1) * limit;
      const where = options?.status ? { status: options.status } : {};

      const [refunds, total] = await Promise.all([
        this.prisma.refund.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: { paymentIntent: true },
        }),
        this.prisma.refund.count({ where }),
      ]);

      return {
        refunds,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to get refunds: ${error}`);
      return {
        success: false,
        error: { code: 'GET_REFUNDS_FAILED', message: 'Failed to retrieve refunds' },
      };
    }
  }

  async getWebhookEvents(options?: { page?: number; limit?: number; provider?: string }) {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const skip = (page - 1) * limit;
      const where = options?.provider ? { provider: options.provider } : {};

      const [events, total] = await Promise.all([
        this.prisma.webhookEvent.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.webhookEvent.count({ where }),
      ]);

      return {
        events,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to get webhook events: ${error}`);
      return {
        success: false,
        error: { code: 'GET_WEBHOOK_EVENTS_FAILED', message: 'Failed to retrieve webhook events' },
      };
    }
  }

  async getPaymentStats() {
    try {
      const [totalPayments, completedPayments, failedPayments, totalIntents, pendingIntents] =
        await Promise.all([
          this.prisma.payment.count(),
          this.prisma.payment.count({ where: { status: 'completed' } }),
          this.prisma.payment.count({ where: { status: 'failed' } }),
          this.prisma.paymentIntent.count(),
          this.prisma.paymentIntent.count({ where: { status: 'pending' } }),
        ]);

      const totalRevenue = await this.prisma.payment.aggregate({
        where: { status: 'completed' },
        _sum: { amount: true },
      });

      return {
        totalPayments,
        completedPayments,
        failedPayments,
        totalIntents,
        pendingIntents,
        totalRevenue: totalRevenue._sum.amount || 0,
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to get payment stats: ${error}`);
      return {
        success: false,
        error: { code: 'GET_STATS_FAILED', message: 'Failed to retrieve payment stats' },
      };
    }
  }
}
