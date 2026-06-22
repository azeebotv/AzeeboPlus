import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getPayments(options?: { page?: number; limit?: number; status?: string }) {
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
  }

  async getPaymentById(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }

  async getPaymentIntents(options?: { page?: number; limit?: number; status?: string }) {
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
  }

  async getRefunds(options?: { page?: number; limit?: number; status?: string }) {
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
  }

  async getWebhookEvents(options?: { page?: number; limit?: number; provider?: string }) {
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
  }

  async getPaymentStats() {
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
  }
}
