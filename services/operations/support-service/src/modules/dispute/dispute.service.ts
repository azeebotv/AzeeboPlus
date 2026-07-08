import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';
import { createApiClient, noopTokenStorage } from '@azeebo/api-client';

@Injectable()
export class DisputeService {
  private readonly logger = new Logger(DisputeService.name);
  private readonly walletServiceClient;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {
    this.walletServiceClient = createApiClient({
      baseUrl: this.configService.getOrThrow<string>('WALLET_SERVICE_URL'),
      timeout: 30000,
      tokenStorage: noopTokenStorage,
    });
  }

  async createDispute(data: {
    ticketId: string;
    creatorId: string;
    payoutId: string;
    amount: Prisma.Decimal;
    currency?: string;
    reason: string;
    evidence?: Prisma.InputJsonValue;
  }) {
    const existing = await this.prisma.payoutDispute.findFirst({
      where: { payoutId: data.payoutId, status: { not: 'RESOLVED' } },
    });

    if (existing) {
      throw new BadRequestException('Dispute already exists for this payout');
    }

    return this.prisma.payoutDispute.create({
      data: {
        ticketId: data.ticketId,
        creatorId: data.creatorId,
        payoutId: data.payoutId,
        amount: data.amount,
        currency: data.currency || 'NGN',
        reason: data.reason,
        evidence: data.evidence,
      },
    });
  }

  async getDisputeById(id: string) {
    const dispute = await this.prisma.payoutDispute.findUnique({
      where: { id },
      include: { ticket: true },
    });
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }
    return dispute;
  }

  async resolveDispute(
    id: string,
    resolution: 'APPROVED' | 'REJECTED' | 'PARTIAL',
    resolvedBy: string,
    notes?: string,
    compensation?: Prisma.Decimal
  ) {
    const dispute = await this.prisma.payoutDispute.findUnique({ where: { id } });
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (resolution === 'APPROVED' && compensation) {
      try {
        await this.walletServiceClient.post('/api/wallet/credit', {
          userId: dispute.creatorId,
          amount: compensation.toNumber(),
          currency: dispute.currency,
          description: `Dispute compensation for payout ${dispute.payoutId}`,
          reference: `dispute-${id}`,
          transactionType: 'dispute_compensation',
        });
      } catch (error) {
        this.logger.error(`Failed to credit wallet for dispute ${id}: ${(error as Error).message}`);
      }
    }

    return this.prisma.payoutDispute.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolution: resolution,
        resolvedAt: new Date(),
        resolvedBy,
        compensation,
      },
    });
  }

  async getPendingDisputes(options?: { page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const [disputes, total] = await Promise.all([
      this.prisma.payoutDispute.findMany({
        where: { status: 'PENDING' },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: { ticket: true },
      }),
      this.prisma.payoutDispute.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      disputes,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getCreatorDisputes(creatorId: string, options?: { page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const [disputes, total] = await Promise.all([
      this.prisma.payoutDispute.findMany({
        where: { creatorId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payoutDispute.count({ where: { creatorId } }),
    ]);

    return {
      disputes,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
