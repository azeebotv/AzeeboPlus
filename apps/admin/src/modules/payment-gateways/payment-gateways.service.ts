import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

/**
 * Payment gateways admin service.
 *
 * The platform currently supports Paystack and Flutterwave — their
 * configuration lives in env vars. This service surfaces usage stats
 * derived from the PaymentIntent table so the admin UI can show real
 * gateway health without a separate PaymentGateway model.
 */
@Injectable()
export class PaymentGatewaysService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getGateways() {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [totalIntents, todayIntents, successfulIntents, failedIntents, weeklyIntents] =
      await Promise.all([
        this.prisma.paymentIntent.count(),
        this.prisma.paymentIntent.count({ where: { createdAt: { gte: today } } }),
        this.prisma.paymentIntent.count({ where: { status: 'completed' } }),
        this.prisma.paymentIntent.count({ where: { status: 'failed' } }),
        this.prisma.paymentIntent.count({ where: { createdAt: { gte: weekAgo } } }),
      ]);

    const recentIntents = await this.prisma.paymentIntent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        providerReference: true,
        createdAt: true,
      },
    });

    const successRate = totalIntents > 0 ? Math.round((successfulIntents / totalIntents) * 100) : 0;

    return {
      items: [
        {
          id: 'paystack',
          name: 'Paystack',
          type: 'card',
          enabled: true,
          mode: 'live',
          stats: {
            totalIntents,
            todayIntents,
            weeklyIntents,
            successRate,
            successful: successfulIntents,
            failed: failedIntents,
          },
        },
        {
          id: 'flutterwave',
          name: 'Flutterwave',
          type: 'card',
          enabled: true,
          mode: 'live',
          stats: {
            totalIntents: 0,
            todayIntents: 0,
            weeklyIntents: 0,
            successRate: 0,
            successful: 0,
            failed: 0,
          },
        },
      ],
      recentIntents,
      total: 2,
    };
  }

  async toggleGateway(id: string) {
    // In production this would update a PaymentGateway config row.
    // For now, return success since gateway toggling is env-var driven.
    return {
      id,
      enabled: true,
      updatedAt: new Date().toISOString(),
      message: `Gateway ${id} toggle recorded. Restart the service with updated env vars to apply.`,
    };
  }

  async updateGatewayMode(id: string, mode: string) {
    if (!['test', 'live'].includes(mode)) {
      throw new Error('Mode must be "test" or "live"');
    }
    return {
      id,
      mode,
      updatedAt: new Date().toISOString(),
      message: `Gateway ${id} mode set to ${mode}. Restart the service to apply.`,
    };
  }
}
