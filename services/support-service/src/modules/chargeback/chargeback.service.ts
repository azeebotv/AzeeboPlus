import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';
import { createApiClient } from '@azeebo/api-client';

@Injectable()
export class ChargebackService {
  private readonly logger = new Logger(ChargebackService.name);
  private readonly paymentServiceClient;
  private readonly walletServiceClient;
  private readonly auditServiceClient;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.paymentServiceClient = createApiClient({
      baseUrl: this.configService.getOrThrow<string>('PAYMENT_SERVICE_URL'),
      timeout: 30000,
    });
    this.walletServiceClient = createApiClient({
      baseUrl: this.configService.getOrThrow<string>('WALLET_SERVICE_URL'),
      timeout: 30000,
    });
    this.auditServiceClient = createApiClient({
      baseUrl: this.configService.getOrThrow<string>('MODERATION_SERVICE_URL'),
      timeout: 30000,
    });
  }

  async initiateChargeback(data: {
    ticketId: string;
    paymentId: string;
    userId: string;
    amount: Prisma.Decimal;
    currency?: string;
    reason: string;
  }) {
    return this.createChargeback(data);
  }

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
        metadata: { evidence } as Prisma.InputJsonValue,
      },
    });
  }

  async resolveChargeback(
    id: string,
    resolution: 'WON' | 'LOST',
    resolvedBy: string,
    evidence?: Record<string, unknown>
  ) {
    const chargeback = await this.prisma.chargeback.findUnique({
      where: { id },
    });

    if (!chargeback) {
      throw new NotFoundException('Chargeback not found');
    }

    if (resolution === 'WON') {
      try {
        await this.paymentServiceClient.post('/api/payment/chargeback-resolve', {
          chargebackId: id,
          paymentId: chargeback.paymentId,
          resolution: 'won',
          resolvedBy,
          evidence,
        });

        const walletResponse = await this.walletServiceClient.post('/api/wallet/credit', {
          userId: chargeback.userId,
          amount: chargeback.amount.toNumber(),
          currency: chargeback.currency,
          description: `Chargeback reversal for payment ${chargeback.paymentId}`,
          reference: chargeback.chargebackRef || id,
          transactionType: 'chargeback_reversal',
        });

        const walletData = walletResponse.data as { id?: string };
        this.logger.log(
          `Chargeback won: payment ${chargeback.paymentId}, wallet txn: ${walletData?.id}`
        );
      } catch (error) {
        this.logger.error(
          `Failed to process chargeback resolution ${id}: ${(error as Error).message}`
        );
        throw new BadRequestException('Failed to process chargeback resolution');
      }
    } else {
      try {
        await this.paymentServiceClient.post('/api/payment/chargeback-resolve', {
          chargebackId: id,
          paymentId: chargeback.paymentId,
          resolution: 'lost',
          resolvedBy,
          evidence,
        });
        this.logger.log(`Chargeback lost: payment ${chargeback.paymentId}`);
      } catch (error) {
        this.logger.error(`Failed to update payment service: ${(error as Error).message}`);
      }
    }

    const resolutionText =
      resolution === 'WON'
        ? 'Chargeback disputed and won - funds returned to customer'
        : 'Chargeback lost - payment reversed';

    const updatedChargeback = await this.prisma.chargeback.update({
      where: { id },
      data: {
        status: resolution,
        resolution: resolutionText,
        resolvedAt: new Date(),
        resolvedBy,
        metadata: evidence
          ? ({ resolutionEvidence: evidence } as Prisma.InputJsonValue)
          : undefined,
      },
    });

    await this.createAuditEvent({
      action: 'chargeback_resolved',
      resourceType: 'chargeback',
      resourceId: id,
      actorType: 'admin',
      actorId: resolvedBy,
      previousState: { status: 'PENDING' },
      newState: { status: resolution, resolution: resolutionText },
      metadata: {
        paymentId: chargeback.paymentId,
        userId: chargeback.userId,
        amount: chargeback.amount.toNumber(),
      },
    });

    return updatedChargeback;
  }

  private async createAuditEvent(event: {
    action: string;
    resourceType: string;
    resourceId: string;
    actorType: string;
    actorId?: string;
    previousState?: Record<string, unknown>;
    newState?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }) {
    try {
      await this.auditServiceClient.post('/api/moderation/audit', event);
    } catch (error) {
      this.logger.error(`Failed to create audit event: ${(error as Error).message}`);
    }
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
