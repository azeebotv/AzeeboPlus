import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { randomUUID } from 'crypto';

export interface AbuseCheckResult {
  passed: boolean;
  flags: string[];
  riskScore: number;
}

export interface AdminAdjustment {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  adjustedBy: string;
  timestamp: Date;
}

@Injectable()
export class RewardAbuseControlsService {
  private readonly logger = new Logger(RewardAbuseControlsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async checkAbuse(userId: string): Promise<AbuseCheckResult> {
    const flags: string[] = [];
    let riskScore = 0;

    const oneHourAgo = new Date(Date.now() - 3_600_000);
    const recentClaims = await this.prisma.pointsLedger.count({
      where: { userId, createdAt: { gte: oneHourAgo } },
    });

    if (recentClaims >= 20) {
      flags.push('RAPID_CLAIMING');
      riskScore += 40;
    }

    const oneDayAgo = new Date(Date.now() - 86_400_000);
    const dailyPoints = await this.prisma.pointsLedger.aggregate({
      where: { userId, createdAt: { gte: oneDayAgo } },
      _sum: { points: true },
    });

    const dailyTotal = Number(dailyPoints._sum.points || 0);
    if (dailyTotal > 10000) {
      flags.push('ABNORMAL_EARN_RATE');
      riskScore += 25;
    }

    return {
      passed: riskScore < 50,
      flags,
      riskScore: Math.min(riskScore, 100),
    };
  }

  async recordAdminAdjustment(
    userId: string,
    amount: number,
    reason: string,
    adjustedBy: string,
  ): Promise<AdminAdjustment> {
    const id = randomUUID();

    await this.prisma.pointsLedger.create({
      data: {
        id,
        userId,
        points: amount,
        type: amount > 0 ? 'credit' : 'debit',
        reason,
        metadata: {
          adjustedBy,
          isAdminAdjustment: true,
        },
      },
    });

    this.logger.log(`Admin reward adjustment: user=${userId} amount=${amount} by=${adjustedBy} reason="${reason}"`);

    return { id, userId, amount, reason, adjustedBy, timestamp: new Date() };
  }

  async redeemSponsorReward(
    userId: string,
    _rewardId: string,
  ): Promise<{ success: boolean; message: string }> {
    const abuseCheck = await this.checkAbuse(userId);
    if (!abuseCheck.passed) {
      this.logger.warn(`Sponsor reward blocked: user=${userId} risk=${abuseCheck.riskScore}`);
      return { success: false, message: 'Reward redemption temporarily restricted' };
    }
    return { success: true, message: 'Reward redemption approved' };
  }
}
