import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ChargebackService {
  constructor(private prisma: PrismaService) {}

  async createChargeback(data: {
    ticketId: string;
    paymentId: string;
    userId: string;
    amount: Prisma.Decimal;
    currency?: string;
    reason: string;
  }) {
    const existing = await this.prisma.chargeback.findFirst({
      where: { paymentId: data.paymentId, status: { not: 'LOST' } },
    });

    if (existing) {
      throw new BadRequestException('Chargeback already exists for this payment');
    }

    const disputeDeadline = new Date();
    disputeDeadline.setDate(disputeDeadline.getDate() + 7);

    const evidenceDue = new Date();
    evidenceDue.setDate(evidenceDue.getDate() + 3);

    const chargeback = await this.prisma.chargeback.create({
      data: {
        ticketId: data.ticketId,
        paymentId: data.paymentId,
        userId: data.userId,
        amount: data.amount,
        currency: data.currency || 'NGN',
        reason: data.reason,
        disputeDeadline,
        evidenceDue,
      },
    });

    return chargeback;
  }

  async getChargebackById(id: string) {
    const chargeback = await this.prisma.chargeback.findUnique({
      where: { id },
      include: { ticket: true },
    });
    if (!chargeback) {
      throw new NotFoundException('Chargeback not found');
    }
    return chargeback;
  }

  async submitEvidence(id: string, evidence: Record<string, unknown>) {
    return this.prisma.chargeback.update({
      where: { id },
      data: {
        metadata: { evidence },
      },
    });
  }

  async resolveChargeback(
    id: string,
    resolution: 'WON' | 'LOST',
    resolvedBy: string,
    evidence?: Record<string, unknown>
  ) {
    const chargeback = await this.prisma.chargeback.update({
      where: { id },
      data: {
        status: resolution,
        resolution:
          resolution === 'WON' ? 'Payment reversed to customer' : 'Chargeback disputed and won',
        resolvedAt: new Date(),
        resolvedBy,
        metadata: evidence
          ? ({ resolutionEvidence: evidence } as Prisma.InputJsonValue)
          : undefined,
      },
    });

    if (resolution === 'WON') {
      await this.prisma.walletTransaction
        .create({
          data: {
            walletId:
              (await this.prisma.wallet.findUnique({ where: { userId: chargeback.userId } }))?.id ||
              '',
            type: 'chargeback_reversal',
            amount: chargeback.amount,
            status: 'completed',
            description: `Chargeback reversal for payment ${chargeback.paymentId}`,
            reference: chargeback.chargebackRef,
          },
        })
        .catch((err) => {
          console.error(
            'Failed to create wallet transaction (wallet-service integration needed):',
            err
          );
        });
    }

    return chargeback;
  }

  async getPendingChargebacks(options?: { page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const [chargebacks, total] = await Promise.all([
      this.prisma.chargeback.findMany({
        where: { status: 'PENDING' },
        skip,
        take: limit,
        orderBy: { disputeDeadline: 'asc' },
        include: { ticket: true },
      }),
      this.prisma.chargeback.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      chargebacks,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUserChargebacks(userId: string, options?: { page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const [chargebacks, total] = await Promise.all([
      this.prisma.chargeback.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.chargeback.count({ where: { userId } }),
    ]);

    return {
      chargebacks,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
