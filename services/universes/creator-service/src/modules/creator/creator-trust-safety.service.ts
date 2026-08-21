import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';

export interface TrustScore {
  creatorId: string;
  score: number;
  level: 'trusted' | 'standard' | 'probation' | 'restricted';
  strikes: number;
}

export interface PolicyViolation {
  id: string;
  creatorId: string;
  contentId?: string;
  policy: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  action: 'warning' | 'strike' | 'suspension' | 'termination';
  createdAt: Date;
}

@Injectable()
export class CreatorTrustSafetyService {
  private readonly logger = new Logger(CreatorTrustSafetyService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getTrustScore(creatorId: string): Promise<TrustScore> {
    const creator = await this.prisma.creatorProfile.findUnique({
      where: { id: creatorId },
    });

    const settings = (creator?.settings as Record<string, unknown>) || {};
    const strikes = (settings.creatorStrikes as number) || 0;
    const violations = (settings.creatorViolations as number) || 0;

    let score = 100;
    score -= strikes * 15;
    score -= violations * 5;
    score = Math.max(score, 0);

    let level: TrustScore['level'] = 'trusted';
    if (score < 30) level = 'restricted';
    else if (score < 60) level = 'probation';
    else if (score < 80) level = 'standard';

    return { creatorId, score, level, strikes };
  }

  async recordViolation(violation: Omit<PolicyViolation, 'id' | 'createdAt'>): Promise<PolicyViolation> {
    const id = randomUUID();

    if (violation.action === 'strike' || violation.action === 'suspension' || violation.action === 'termination') {
      const creator = await this.prisma.creatorProfile.findUnique({
        where: { id: violation.creatorId },
        select: { settings: true },
      });

      const settings = (creator?.settings as Record<string, unknown>) || {};
      const currentStrikes = (settings.creatorStrikes as number) || 0;

      const newSettings: Record<string, unknown> = {
        ...settings,
        creatorStrikes: violation.action === 'strike' ? currentStrikes + 1 : currentStrikes,
        creatorLastViolation: new Date().toISOString(),
        creatorViolations: ((settings.creatorViolations as number) || 0) + 1,
      };

      await this.prisma.creatorProfile.update({
        where: { id: violation.creatorId },
        data: {
          settings: newSettings as unknown as Prisma.InputJsonValue,
        },
      });
    }

    this.logger.warn(`Creator violation: ${violation.creatorId} — ${violation.policy} (${violation.severity}) → ${violation.action}`);
    return { ...violation, id, createdAt: new Date() };
  }

  async checkMonetizationEligibility(creatorId: string): Promise<{
    eligible: boolean;
    reason?: string;
    requirements: Record<string, boolean>;
  }> {
    const trustScore = await this.getTrustScore(creatorId);

    const requirements = {
      trustScoreAbove60: trustScore.score >= 60,
      noRecentStrikes: trustScore.strikes < 3,
      accountActive: true,
    };

    const eligible = Object.values(requirements).every(Boolean);
    return {
      eligible,
      reason: eligible ? undefined : 'Creator does not meet monetization requirements',
      requirements,
    };
  }
}
