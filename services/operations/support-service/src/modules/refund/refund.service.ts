import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';
import { createApiClient } from '@azeebo/api-client';

@Injectable()
export class RefundService {
  private readonly logger = new Logger(RefundService.name);
  private readonly paymentServiceClient = createApiClient({
    baseUrl: '',
    timeout: 30000,
  });
  private readonly walletServiceClient = createApiClient({
    baseUrl: '',
    timeout: 30000,
  });
  private readonly auditServiceClient = createApiClient({
    baseUrl: '',
    timeout: 30000,
  });
  private readonly notificationServiceClient = createApiClient({
    baseUrl: '',
    timeout: 30000,
  });

  constructor(private prisma: PrismaService, private configService: ConfigService) {
    const timeout = parseInt(this.configService.get<string>('DEFAULT_API_TIMEOUT') || '30000', 10);
    this.paymentServiceClient = createApiClient({
      baseUrl: this.configService.getOrThrow<string>('PAYMENT_SERVICE_URL'),
      timeout,
    });
    this.walletServiceClient = createApiClient({
      baseUrl: this.configService.getOrThrow<string>('WALLET_SERVICE_URL'),
      timeout,
    });
    this.auditServiceClient = createApiClient({
      baseUrl: this.configService.getOrThrow<string>('MODERATION_SERVICE_URL'),
      timeout,
    });
    this.notificationServiceClient = createApiClient({
      baseUrl: this.configService.getOrThrow<string>('NOTIFICATION_SERVICE_URL'),
      timeout,
    });
  }

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
    const refund = await this.prisma.refund.findUnique({
      where: { id },
    });

    if (!refund) {
      throw new NotFoundException('Refund not found');
    }

    try {
      await this.paymentServiceClient.post('/api/payment/refund', {
        paymentId: refund.paymentId,
        amount: refund.amount.toNumber(),
        currency: refund.currency,
        reference: refundReference,
        processedBy,
      });

      const walletResponse = await this.walletServiceClient.post('/api/wallet/credit', {
        userId: refund.userId,
        amount: refund.amount.toNumber(),
        currency: refund.currency,
        description: `Refund for payment ${refund.paymentId}`,
        reference: refundReference,
        transactionType: 'refund',
      });

      const walletData = walletResponse.data as { id?: string };
      this.logger.log(
        `Refund processed: payment ${refund.paymentId}, wallet txn: ${walletData?.id}`
      );
    } catch (error) {
      this.logger.error(`Failed to process refund ${id}: ${(error as Error).message}`);
      throw new BadRequestException('Failed to process refund');
    }

    const updatedRefund = await this.prisma.refund.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
        processedBy,
        refundReference,
      },
    });

    await Promise.all([
      this.createAuditEvent({
        action: 'refund_processed',
        resourceType: 'refund',
        resourceId: id,
        actorType: 'admin',
        actorId: processedBy,
        previousState: { status: 'PENDING' },
        newState: { status: 'COMPLETED', refundReference },
        metadata: { paymentId: refund.paymentId, userId: refund.userId },
      }),
      this.sendRefundNotification(refund.userId, 'approved', {
        refundId: id,
        amount: refund.amount.toNumber(),
        currency: refund.currency,
      }),
    ]);

    return updatedRefund;
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
      await this.auditServiceClient.post('/api/moderation/audit', {
        ...event,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Failed to create audit event: ${(error as Error).message}`);
    }
  }

  private async sendRefundNotification(
    userId: string,
    status: 'approved' | 'rejected',
    details: {
      refundId: string;
      amount?: number;
      currency?: string;
      reason?: string;
    }
  ) {
    try {
      if (status === 'approved') {
        await this.notificationServiceClient.post('/api/notifications', {
          userId,
          type: 'REFUND_APPROVED',
          title: 'Refund Approved',
          message: `Your refund of ${details.amount} ${details.currency} has been processed. The funds have been credited to your wallet.`,
          metadata: {
            refundId: details.refundId,
            amount: details.amount,
            currency: details.currency,
          },
          priority: 'high',
        });
      } else {
        await this.notificationServiceClient.post('/api/notifications', {
          userId,
          type: 'REFUND_REJECTED',
          title: 'Refund Rejected',
          message: `Your refund request has been rejected. Reason: ${details.reason || 'Not specified'}.`,
          metadata: { refundId: details.refundId, reason: details.reason },
          priority: 'high',
        });
      }
    } catch (error) {
      this.logger.error(`Failed to send refund notification: ${(error as Error).message}`);
    }
  }

  async rejectRefund(id: string, reason: string) {
    const refund = await this.prisma.refund.findUnique({ where: { id } });
    if (!refund) {
      throw new NotFoundException('Refund not found');
    }

    const updatedRefund = await this.prisma.refund.update({
      where: { id },
      data: {
        status: 'REJECTED',
        metadata: { rejectionReason: reason },
      },
    });

    await Promise.all([
      this.createAuditEvent({
        action: 'refund_rejected',
        resourceType: 'refund',
        resourceId: id,
        actorType: 'admin',
        previousState: { status: 'PENDING' },
        newState: { status: 'REJECTED', rejectionReason: reason },
        metadata: { userId: refund.userId },
      }),
      this.sendRefundNotification(refund.userId, 'rejected', {
        refundId: id,
        reason,
      }),
    ]);

    return updatedRefund;
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
