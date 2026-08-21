import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { randomUUID } from 'crypto';

export interface CreatorEarnings {
  creatorId: string;
  totalEarnings: string;
  pendingPayouts: string;
  paidOut: string;
  breakdown: Record<string, string>;
}

export interface PayoutRequest {
  creatorId: string;
  amount: number;
  method: 'bank_transfer' | 'mobile_money' | 'crypto';
  accountDetails: Record<string, string>;
}

export interface Payout {
  id: string;
  creatorId: string;
  amount: string;
  method: string;
  status: string;
  createdAt: Date;
}

const MINIMUM_PAYOUT = 5000;

@Injectable()
export class CreatorPayoutService {
  private readonly logger = new Logger(CreatorPayoutService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getCreatorEarnings(creatorId: string): Promise<CreatorEarnings> {
    const earnings = await this.prisma.creatorEarning.findMany({
      where: { creatorId },
    });

    let totalEarnings = 0;
    for (const e of earnings) {
      totalEarnings += Number(e.amount || 0);
    }

    const payouts = await this.prisma.payoutRequest.findMany({
      where: { creatorId },
    });

    let paidOut = 0;
    let pendingPayouts = 0;
    for (const p of payouts) {
      if (p.status === 'completed') paidOut += Number(p.amount || 0);
      else if (p.status === 'pending') pendingPayouts += Number(p.amount || 0);
    }

    return {
      creatorId,
      totalEarnings: totalEarnings.toString(),
      pendingPayouts: pendingPayouts.toString(),
      paidOut: paidOut.toString(),
      breakdown: { earnings: totalEarnings.toString() },
    };
  }

  async requestPayout(request: PayoutRequest): Promise<Payout> {
    const earnings = await this.getCreatorEarnings(request.creatorId);
    const available = Number(earnings.totalEarnings) - Number(earnings.paidOut) - Number(earnings.pendingPayouts);

    if (request.amount > available) {
      throw new BadRequestException(`Insufficient balance. Available: ${(available / 100).toFixed(2)}`);
    }

    if (request.amount < MINIMUM_PAYOUT) {
      throw new BadRequestException(`Minimum payout is $${(MINIMUM_PAYOUT / 100).toFixed(2)}`);
    }

    const payoutId = randomUUID();

    const payout = await this.prisma.payoutRequest.create({
      data: {
        id: payoutId,
        creatorId: request.creatorId,
        amount: request.amount,
        status: 'pending',
        method: request.method,
        accountDetails: request.accountDetails,
      },
    });

    this.logger.log(`Payout requested: ${payoutId} for creator ${request.creatorId}`);

    return {
      id: payout.id,
      creatorId: request.creatorId,
      amount: payout.amount.toString(),
      method: payout.method,
      status: payout.status,
      createdAt: payout.createdAt,
    };
  }

  async getPayoutHistory(creatorId: string, limit: number = 20): Promise<Payout[]> {
    const payouts = await this.prisma.payoutRequest.findMany({
      where: { creatorId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return payouts.map((p) => ({
      id: p.id,
      creatorId,
      amount: p.amount.toString(),
      method: p.method,
      status: p.status,
      createdAt: p.createdAt,
    }));
  }
}
