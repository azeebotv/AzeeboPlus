import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class CronTasksService {
  private readonly logger = new Logger(CronTasksService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async cleanupStalePaymentIntents(): Promise<void> {
    this.logger.log('Running stale payment intent cleanup...');

    try {
      const staleThreshold = new Date(Date.now() - 30 * 60 * 1000);

      const result = await this.prisma.paymentIntent.updateMany({
        where: {
          status: 'pending',
          createdAt: { lt: staleThreshold },
        },
        data: {
          status: 'expired',
        },
      });

      this.logger.log(`Expired ${result.count} stale payment intents`);
    } catch (error: unknown) {
      this.logger.error('Failed to cleanup stale payment intents', error);
    }
  }

  async cleanupStaleWebhookRetries(): Promise<void> {
    this.logger.log('Running stale webhook retry cleanup...');

    try {
      const staleThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const result = await this.prisma.webhookRetry.updateMany({
        where: {
          status: 'pending',
          createdAt: { lt: staleThreshold },
        },
        data: {
          status: 'expired',
        },
      });

      this.logger.log(`Marked ${result.count} stale webhook retries as expired`);
    } catch (error: unknown) {
      this.logger.error('Failed to cleanup stale webhook retries', error);
    }
  }

  async generatePaymentMetrics(): Promise<Record<string, unknown>> {
    this.logger.log('Generating payment metrics...');

    try {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [totalPayments, successfulPayments, failedPayments, totalIntents, pendingIntents] =
        await Promise.all([
          this.prisma.payment.count({
            where: { createdAt: { gte: weekAgo } },
          }),
          this.prisma.payment.count({
            where: { createdAt: { gte: weekAgo }, status: 'completed' },
          }),
          this.prisma.payment.count({
            where: { createdAt: { gte: weekAgo }, status: 'failed' },
          }),
          this.prisma.paymentIntent.count({
            where: { createdAt: { gte: weekAgo } },
          }),
          this.prisma.paymentIntent.count({
            where: { createdAt: { gte: weekAgo }, status: 'pending' },
          }),
        ]);

      const totalRevenue = await this.prisma.payment.aggregate({
        where: { createdAt: { gte: weekAgo }, status: 'completed' },
        _sum: { amount: true },
      });

      return {
        period: {
          start: weekAgo.toISOString(),
          end: new Date().toISOString(),
        },
        payments: {
          total: totalPayments,
          successful: successfulPayments,
          failed: failedPayments,
          successRate: totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0,
        },
        intents: {
          total: totalIntents,
          pending: pendingIntents,
        },
        revenue: {
          total: totalRevenue._sum.amount || 0,
          currency: 'NGN',
        },
        generatedAt: new Date().toISOString(),
      };
    } catch (error: unknown) {
      this.logger.error('Failed to generate payment metrics', error);
      return { error: 'Failed to generate metrics', generatedAt: new Date().toISOString() };
    }
  }
}
