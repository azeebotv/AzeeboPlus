import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class RefundService {
  constructor(private prisma: PrismaService) {}

  async requestRefund(data: {
    userId: string;
    paymentId: string;
    amount: Prisma.Decimal;
    currency?: string;
    reason: string;
    ticketId: string;
  }) {
    const existing = await this.prisma.refund.findFirst({
      where: { paymentId: data.paymentId, status: { not: 'REJECTED' } },
    });

    if (existing) {
      throw new BadRequestException('Refund already requested for this payment');
    }

    const refund = await this.prisma.refund.create({
      data: {
        paymentId: data.paymentId,
        userId: data.userId,
        amount: data.amount,
        currency: data.currency || 'NGN',
        reason: data.reason,
        ticketId: data.ticketId,
      },
    });

    return refund;
  }

  async getRefundById(id: string) {
    const refund = await this.prisma.refund.findUnique({
      where: { id },
      include: { ticket: true },
    });
    if (!refund) {
      throw new NotFoundException('Refund not found');
    }
    return refund;
  }

  async getUserRefunds(userId: string, options?: { page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const [refunds, total] = await Promise.all([
      this.prisma.refund.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.refund.count({ where: { userId } }),
    ]);

    return {
      refunds,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async processRefund(id: string, processedBy: string, refundReference: string) {
    const refund = await this.prisma.refund.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
        processedBy,
        refundReference,
      },
    });

    await this.prisma.walletTransaction
      .create({
        data: {
          walletId:
            (await this.prisma.wallet.findUnique({ where: { userId: refund.userId } }))?.id || '',
          type: 'refund',
          amount: refund.amount,
          status: 'completed',
          description: `Refund for payment ${refund.paymentId}`,
          reference: refundReference,
        },
      })
      .catch((err) => {
        console.error(
          'Failed to create wallet transaction (wallet-service integration needed):',
          err
        );
      });

    return refund;
  }

  async rejectRefund(id: string, reason: string) {
    return this.prisma.refund.update({
      where: { id },
      data: {
        status: 'REJECTED',
        metadata: { rejectionReason: reason },
      },
    });
  }

  async getPendingRefunds(options?: { page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const [refunds, total] = await Promise.all([
      this.prisma.refund.findMany({
        where: { status: 'PENDING' },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: { ticket: true },
      }),
      this.prisma.refund.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      refunds,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
