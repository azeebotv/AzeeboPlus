import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { randomUUID } from 'crypto';

export interface RefundRequest {
  transactionId: string;
  amount?: number;
  reason: string;
  requestedBy: string;
}

export interface ReconciliationResult {
  date: string;
  matched: number;
  mismatched: number;
  discrepancies: Array<{
    transactionId: string;
    internalAmount: string;
    providerAmount: string;
    status: string;
  }>;
}

@Injectable()
export class PaymentReconciliationService {
  private readonly logger = new Logger(PaymentReconciliationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async requestRefund(params: RefundRequest): Promise<{
    refundId: string;
    status: string;
    message: string;
  }> {
    const payment = await this.prisma.paymentIntent.findUnique({
      where: { id: params.transactionId },
    });

    if (!payment) {
      throw new NotFoundException(`Transaction ${params.transactionId} not found`);
    }

    if (payment.status !== 'success') {
      throw new BadRequestException('Can only refund successful transactions');
    }

    const refundAmount = params.amount || Number(payment.amount);
    if (refundAmount > Number(payment.amount)) {
      throw new BadRequestException('Refund amount cannot exceed transaction amount');
    }

    const refundId = randomUUID();

    await this.prisma.refund.create({
      data: {
        id: refundId,
        paymentIntentId: params.transactionId,
        amount: refundAmount,
        reason: params.reason,
        status: 'pending',
      },
    });

    this.logger.log(`Refund requested: ${refundId} for transaction ${params.transactionId}`);

    return {
      refundId,
      status: 'pending',
      message: 'Refund request submitted and pending review',
    };
  }

  async processRefund(
    refundId: string,
    decision: 'approved' | 'rejected',
    processedBy: string,
    note?: string
  ): Promise<{ refundId: string; status: string }> {
    const refund = await this.prisma.refund.findUnique({
      where: { id: refundId },
    });

    if (!refund) {
      throw new NotFoundException(`Refund ${refundId} not found`);
    }

    if (refund.status !== 'pending') {
      throw new BadRequestException(`Refund is already ${refund.status}`);
    }

    const newStatus = decision === 'approved' ? 'approved' : 'rejected';

    await this.prisma.refund.update({
      where: { id: refundId },
      data: {
        status: newStatus,
        providerReference: note || undefined,
      },
    });

    this.logger.log(`Refund ${refundId} ${decision} by ${processedBy}`);

    return { refundId, status: newStatus };
  }

  async reconcileTransactions(date?: Date): Promise<ReconciliationResult> {
    const targetDate = date || new Date();
    targetDate.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const discrepancies: ReconciliationResult['discrepancies'] = [];
    let matched = 0;
    let mismatched = 0;

    // Cursor-paginate in batches: a single day's intents outgrow memory as
    // volume grows, and one unbounded findMany loads them all at once.
    const BATCH_SIZE = 500;
    let cursor: string | undefined;
    for (;;) {
      const payments = await this.prisma.paymentIntent.findMany({
        where: {
          createdAt: { gte: targetDate, lte: endOfDay },
          status: { in: ['success', 'failed'] },
        },
        orderBy: { id: 'asc' },
        take: BATCH_SIZE,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });
      if (payments.length === 0) break;
      cursor = payments[payments.length - 1].id;

      for (const payment of payments) {
        const metadata = (payment as Record<string, unknown>).metadata as
          | Record<string, unknown>
          | undefined;
        const providerVerified = metadata?.providerVerified as boolean | undefined;

        if (providerVerified === undefined) {
          mismatched++;
          discrepancies.push({
            transactionId: payment.id,
            internalAmount: payment.amount.toString(),
            providerAmount: 'unverified',
            status: payment.status,
          });
        } else {
          matched++;
        }
      }

      // A short batch means this was the last page. Checking here (not only on
      // the next empty page) keeps a non-advancing cursor from looping forever.
      if (payments.length < BATCH_SIZE) break;
    }

    this.logger.log(
      `Reconciliation for ${targetDate.toISOString().split('T')[0]}: ${matched} matched, ${mismatched} mismatched`
    );

    return {
      date: targetDate.toISOString().split('T')[0],
      matched,
      mismatched,
      discrepancies,
    };
  }

  async getGatewayStatus(): Promise<
    Array<{ provider: string; enabled: boolean; mode: 'test' | 'live' }>
  > {
    return ['paystack', 'flutterwave'].map((provider) => ({
      provider,
      enabled: true,
      mode: (process.env.NODE_ENV === 'production' ? 'live' : 'test') as 'test' | 'live',
    }));
  }

  async toggleGateway(
    provider: string,
    enabled: boolean,
    toggledBy: string
  ): Promise<{ provider: string; enabled: boolean }> {
    this.logger.log(
      `Payment gateway ${provider} ${enabled ? 'enabled' : 'disabled'} by ${toggledBy}`
    );
    return { provider, enabled };
  }

  async switchGatewayMode(
    provider: string,
    mode: 'test' | 'live',
    switchedBy: string
  ): Promise<{ provider: string; mode: string }> {
    this.logger.log(`Payment gateway ${provider} switched to ${mode} by ${switchedBy}`);
    return { provider, mode };
  }
}
