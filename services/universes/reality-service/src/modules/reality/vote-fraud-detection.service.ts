import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

export interface FraudCheckResult {
  passed: boolean;
  flags: string[];
  riskScore: number;
  action: 'allow' | 'flag' | 'throttle' | 'block';
}

export interface VoteContext {
  userId: string;
  showId: string;
  contestantId: string;
  voteType: 'regular' | 'super';
  ipAddress?: string;
}

const RATE_LIMITS = {
  regularVotesPerMinute: 5,
  superVotesPerMinute: 3,
  regularVotesPerHour: 30,
  superVotesPerHour: 10,
};

@Injectable()
export class VoteFraudDetectionService {
  private readonly logger = new Logger(VoteFraudDetectionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async checkVote(context: VoteContext): Promise<FraudCheckResult> {
    const flags: string[] = [];
    let riskScore = 0;

    const rateCheck = await this.checkRateLimit(context);
    if (!rateCheck.passed) {
      flags.push(...rateCheck.flags);
      riskScore += rateCheck.riskScore;
    }

    if (context.ipAddress) {
      const ipCheck = await this.checkIPAnomaly(context);
      if (!ipCheck.passed) {
        flags.push(...ipCheck.flags);
        riskScore += ipCheck.riskScore;
      }
    }

    const patternCheck = await this.checkVotingPattern(context);
    if (!patternCheck.passed) {
      flags.push(...patternCheck.flags);
      riskScore += patternCheck.riskScore;
    }

    riskScore = Math.min(riskScore, 100);

    let action: FraudCheckResult['action'] = 'allow';
    if (riskScore >= 80) action = 'block';
    else if (riskScore >= 50) action = 'throttle';
    else if (riskScore >= 20) action = 'flag';

    if (flags.length > 0) {
      this.logger.warn(
        `Vote fraud: user=${context.userId} show=${context.showId} risk=${riskScore} flags=[${flags.join(', ')}]`
      );
    }

    return { passed: action === 'allow', flags, riskScore, action };
  }

  private async checkRateLimit(context: VoteContext): Promise<FraudCheckResult> {
    const flags: string[] = [];
    let riskScore = 0;

    const oneMinuteAgo = new Date(Date.now() - 60_000);
    const oneHourAgo = new Date(Date.now() - 3_600_000);

    const recentVotes = await this.prisma.vote.count({
      where: { userId: context.userId, showId: context.showId, createdAt: { gte: oneMinuteAgo } },
    });

    const hourlyVotes = await this.prisma.vote.count({
      where: { userId: context.userId, showId: context.showId, createdAt: { gte: oneHourAgo } },
    });

    const limit =
      context.voteType === 'super'
        ? RATE_LIMITS.superVotesPerMinute
        : RATE_LIMITS.regularVotesPerMinute;
    if (recentVotes >= limit) {
      flags.push('RATE_LIMIT_PER_MINUTE');
      riskScore += 40;
    }

    const hourlyLimit =
      context.voteType === 'super'
        ? RATE_LIMITS.superVotesPerHour
        : RATE_LIMITS.regularVotesPerHour;
    if (hourlyVotes >= hourlyLimit) {
      flags.push('RATE_LIMIT_PER_HOUR');
      riskScore += 30;
    }

    return {
      passed: flags.length === 0,
      flags,
      riskScore,
      action: riskScore >= 50 ? 'throttle' : 'allow',
    };
  }

  private async checkIPAnomaly(context: VoteContext): Promise<FraudCheckResult> {
    const flags: string[] = [];
    let riskScore = 0;

    const oneHourAgo = new Date(Date.now() - 3_600_000);

    const result = await this.prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(DISTINCT "userId") as count FROM "votes" WHERE "showId" = $1 AND "contestantId" = $2 AND "createdAt" > $3`,
      context.showId,
      context.contestantId,
      oneHourAgo
    );

    const distinctUsers = Number(result[0]?.count || 0);
    if (distinctUsers > 20) {
      flags.push('IP_MULTI_ACCOUNT');
      riskScore += 50;
    } else if (distinctUsers > 10) {
      flags.push('IP_SUSPICIOUS');
      riskScore += 20;
    }

    return {
      passed: flags.length === 0,
      flags,
      riskScore,
      action: riskScore >= 50 ? 'block' : 'flag',
    };
  }

  private async checkVotingPattern(context: VoteContext): Promise<FraudCheckResult> {
    const flags: string[] = [];
    let riskScore = 0;

    const recentSameContestantVotes = await this.prisma.vote.count({
      where: {
        userId: context.userId,
        showId: context.showId,
        contestantId: context.contestantId,
        createdAt: { gte: new Date(Date.now() - 3_600_000) },
      },
    });

    if (recentSameContestantVotes >= 20) {
      flags.push('REPEATED_SAME_CONTESTANT');
      riskScore += 30;
    }

    const recentDistinctContestants = await this.prisma.vote.findMany({
      where: {
        userId: context.userId,
        showId: context.showId,
        createdAt: { gte: new Date(Date.now() - 600_000) },
      },
      select: { contestantId: true },
      distinct: ['contestantId'],
    });

    if (recentDistinctContestants.length >= 5) {
      flags.push('RAPID_VOTE_SWITCHING');
      riskScore += 15;
    }

    return {
      passed: flags.length === 0,
      flags,
      riskScore,
      action: riskScore >= 50 ? 'throttle' : 'flag',
    };
  }

  async getVoteAuditTrail(
    voteId: string
  ): Promise<{ vote: Record<string, unknown>; hash: string; verified: boolean } | null> {
    const vote = await this.prisma.vote.findUnique({ where: { id: voteId } });
    if (!vote) return null;

    const { createHash } = await import('crypto');
    const voteData = {
      id: vote.id,
      userId: vote.userId,
      showId: vote.showId,
      contestantId: vote.contestantId,
      createdAt: vote.createdAt?.toISOString(),
    };
    const hash = createHash('sha256').update(JSON.stringify(voteData)).digest('hex');

    return { vote: voteData as unknown as Record<string, unknown>, hash, verified: true };
  }
}
