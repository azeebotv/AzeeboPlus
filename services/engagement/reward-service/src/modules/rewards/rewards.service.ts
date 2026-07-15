import { Inject, Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service.js';
import { RewardResponse } from './interfaces/reward-response.interface.js';
import { CacheService, cacheKey } from '@azeebo/shared-services';

interface MissionWithCompletion {
  id: string;
  title: string;
  description: string | null;
  points: number;
  type: string;
  isActive: boolean;
  isCompleted: boolean;
}

@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name);
  private readonly defaultPaginationLimit: number;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CacheService) private readonly cacheService: CacheService,
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {
    this.defaultPaginationLimit = this.configService.get<number>('DEFAULT_PAGINATION_LIMIT', 100);
  }

  private async invalidateRewardCache(userId: string): Promise<void> {
    await this.cacheService.delete(cacheKey('reward', `balance:${userId}`));
    await this.cacheService.delete(cacheKey('reward', `badges:${userId}`));
    await this.cacheService.delete(cacheKey('reward', `missions:${userId}`));
  }

  async getRewardAccount(userId: string): Promise<RewardResponse> {
    try {
      const rewardAccount = await this.prisma.rewardAccount.findUnique({
        where: { userId },
        include: {
          badges: true,
          level: true,
        },
      });

      if (!rewardAccount) {
        const newAccount = await this.prisma.rewardAccount.create({
          data: {
            userId,
            points: 0,
            levelId: 'level-1',
            streak: 0,
            lastLoginAt: new Date(),
          },
          include: {
            badges: true,
            level: true,
          },
        });

        return {
          success: true,
          data: {
            rewardAccount: {
              id: newAccount.id,
              userId: newAccount.userId,
              points: newAccount.points,
              levelId: newAccount.levelId,
              streak: newAccount.streak,
              lastLoginAt: newAccount.lastLoginAt,
              lastCheckInAt: newAccount.lastCheckInAt,
              createdAt: newAccount.createdAt,
              updatedAt: newAccount.updatedAt,
            },
            level: newAccount.level,
          },
        };
      }

      return {
        success: true,
        data: {
          rewardAccount: {
            id: rewardAccount.id,
            userId: rewardAccount.userId,
            points: rewardAccount.points,
            levelId: rewardAccount.levelId,
            streak: rewardAccount.streak,
            lastLoginAt: rewardAccount.lastLoginAt,
            lastCheckInAt: rewardAccount.lastCheckInAt,
            createdAt: rewardAccount.createdAt,
            updatedAt: rewardAccount.updatedAt,
          },
          level: rewardAccount.level,
        },
      };
    } catch (error) {
      this.logger.error(
        `getRewardAccount failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return {
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: (error as Error).message },
      };
    }
  }

  async getMissions(userId: string, limit = this.defaultPaginationLimit): Promise<RewardResponse> {
    try {
      const cacheK = cacheKey('reward', `missions:${userId}`);
      const cached = await this.cacheService.get<RewardResponse>(cacheK);
      if (cached) return cached;

      const missions = await this.prisma.mission.findMany({
        where: { isActive: true },
        include: {
          rewards: true,
        },
        take: limit,
      });

      const completedMissions = await this.prisma.missionCompletion.findMany({
        where: { userId },
        select: { missionId: true },
      });

      const completedMissionIds = completedMissions.map((m) => m.missionId);

      const missionsWithCompletion: MissionWithCompletion[] = missions.map((mission) => ({
        id: mission.id,
        title: mission.title,
        description: mission.description,
        points: mission.points,
        type: mission.type,
        isActive: mission.isActive,
        isCompleted: completedMissionIds.includes(mission.id),
      }));

      const result: RewardResponse = {
        success: true,
        data: {
          missions: missionsWithCompletion,
        },
      };

      await this.cacheService.set(cacheK, result, 300);
      return result;
    } catch (error) {
      this.logger.error(`getMissions failed: ${(error as Error).message}`, (error as Error).stack);
      return {
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: (error as Error).message },
      };
    }
  }

  async getBadges(userId: string): Promise<RewardResponse> {
    try {
      const cacheK = cacheKey('reward', `badges:${userId}`);
      const cached = await this.cacheService.get<RewardResponse>(cacheK);
      if (cached) return cached;

      const rewardAccount = await this.prisma.rewardAccount.findUnique({
        where: { userId },
        select: { badges: true },
      });
      const badges = await this.prisma.badge.findMany({
        where: {
          id: {
            in: rewardAccount?.badges.map((b) => b.id) || [],
          },
        },
      });

      const result: RewardResponse = {
        success: true,
        data: {
          badges: badges.map((badge) => ({
            id: badge.id,
            name: badge.name,
            description: badge.description,
            icon: badge.icon,
            points: badge.points,
          })),
        },
      };

      await this.cacheService.set(cacheK, result, 300);
      return result;
    } catch (error) {
      this.logger.error(`getBadges failed: ${(error as Error).message}`, (error as Error).stack);
      return {
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: (error as Error).message },
      };
    }
  }

  async getStreak(userId: string): Promise<RewardResponse> {
    try {
      const rewardAccount = await this.prisma.rewardAccount.findUnique({
        where: { userId },
      });

      if (!rewardAccount) {
        throw new NotFoundException(`Reward account not found for user ${userId}`);
      }

      const today = new Date();
      const lastLogin = rewardAccount.lastLoginAt;
      const daysSinceLastLogin = Math.floor(
        (today.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)
      );

      let currentStreak = rewardAccount.streak;

      if (daysSinceLastLogin === 1) {
        currentStreak = rewardAccount.streak + 1;
      } else if (daysSinceLastLogin === 0) {
        currentStreak = rewardAccount.streak;
      } else if (daysSinceLastLogin > 1) {
        currentStreak = 0;
      }

      return {
        success: true,
        data: {
          streak: {
            current: currentStreak,
            lastCheckInAt: rewardAccount.lastCheckInAt,
          },
        },
      };
    } catch (error) {
      this.logger.error(`getStreak failed: ${(error as Error).message}`, (error as Error).stack);
      return {
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: (error as Error).message },
      };
    }
  }

  async redeemReward(userId: string, rewardId: string): Promise<RewardResponse> {
    try {
      const reward = await this.prisma.reward.findUnique({
        where: { id: rewardId },
      });

      if (!reward) {
        throw new NotFoundException(`Reward not found`);
      }

      const updatedAccount = await this.prisma.$transaction(async (tx) => {
        const lockedRows = await tx.$queryRaw<{ points: number }[]>`
          SELECT points FROM "reward_accounts" WHERE "userId" = ${userId} FOR UPDATE
        `;

        if (!lockedRows.length) {
          throw new NotFoundException(`Reward account not found for user ${userId}`);
        }

        if (lockedRows[0].points < reward.cost) {
          throw new BadRequestException('Insufficient points');
        }

        const account = await tx.rewardAccount.update({
          where: { userId },
          data: { points: { decrement: reward.cost } },
        });

        await tx.rewardRedemption.create({
          data: {
            userId,
            rewardId,
            pointsCost: reward.cost,
          },
        });

        return account;
      });

      await this.invalidateRewardCache(userId);

      return {
        success: true,
        data: {
          message: 'Reward redeemed successfully',
          rewardAccount: {
            id: updatedAccount.id,
            userId: updatedAccount.userId,
            points: updatedAccount.points,
            levelId: updatedAccount.levelId,
            streak: updatedAccount.streak,
            lastLoginAt: updatedAccount.lastLoginAt,
            lastCheckInAt: updatedAccount.lastCheckInAt,
            createdAt: updatedAccount.createdAt,
            updatedAt: updatedAccount.updatedAt,
          },
        },
      };
    } catch (error) {
      this.logger.error(`redeemReward failed: ${(error as Error).message}`, (error as Error).stack);
      return {
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: (error as Error).message },
      };
    }
  }

  async getLevel(userId: string): Promise<RewardResponse> {
    try {
      const rewardAccount = await this.prisma.rewardAccount.findUnique({
        where: { userId },
        include: { level: true },
      });

      if (!rewardAccount) {
        throw new NotFoundException(`Reward account not found for user ${userId}`);
      }

      const nextLevel = await this.prisma.level.findFirst({
        where: { rank: rewardAccount.level.rank + 1 },
      });

      return {
        success: true,
        data: {
          level: {
            id: rewardAccount.level.id,
            name: rewardAccount.level.name,
            rank: rewardAccount.level.rank,
            minPoints: rewardAccount.level.minPoints,
            icon: rewardAccount.level.icon,
            color: rewardAccount.level.color,
          },
          rewardAccount: {
            id: rewardAccount.id,
            userId: rewardAccount.userId,
            points: rewardAccount.points,
            levelId: rewardAccount.levelId,
            streak: rewardAccount.streak,
            lastLoginAt: rewardAccount.lastLoginAt,
            lastCheckInAt: rewardAccount.lastCheckInAt,
            createdAt: rewardAccount.createdAt,
            updatedAt: rewardAccount.updatedAt,
          },
          message: nextLevel
            ? `${nextLevel.minPoints - rewardAccount.points} points to next level`
            : 'Max level reached',
        },
      };
    } catch (error) {
      this.logger.error(`getLevel failed: ${(error as Error).message}`, (error as Error).stack);
      return {
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: (error as Error).message },
      };
    }
  }

  async addPoints(userId: string, points: number, reason: string): Promise<RewardResponse> {
    try {
      if (points <= 0) {
        throw new BadRequestException('Points must be positive');
      }

      const rewardAccount = await this.prisma.rewardAccount.findUnique({
        where: { userId },
      });

      if (!rewardAccount) {
        throw new NotFoundException(`Reward account not found for user ${userId}`);
      }

      const [updatedAccount] = await this.prisma.$transaction([
        this.prisma.rewardAccount.update({
          where: { userId },
          data: {
            points: { increment: points },
          },
        }),
        this.prisma.pointsLedger.create({
          data: {
            userId,
            points,
            reason,
            type: 'credit',
          },
        }),
      ]);

      await this.invalidateRewardCache(userId);

      return {
        success: true,
        data: {
          message: 'Points added successfully',
          rewardAccount: {
            id: updatedAccount.id,
            userId: updatedAccount.userId,
            points: updatedAccount.points,
            levelId: updatedAccount.levelId,
            streak: updatedAccount.streak,
            lastLoginAt: updatedAccount.lastLoginAt,
            lastCheckInAt: updatedAccount.lastCheckInAt,
            createdAt: updatedAccount.createdAt,
            updatedAt: updatedAccount.updatedAt,
          },
        },
      };
    } catch (error) {
      this.logger.error(`addPoints failed: ${(error as Error).message}`, (error as Error).stack);
      return {
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: (error as Error).message },
      };
    }
  }

  async checkIn(userId: string): Promise<RewardResponse> {
    try {
      const rewardAccount = await this.prisma.rewardAccount.findUnique({
        where: { userId },
      });

      if (!rewardAccount) {
        throw new NotFoundException(`Reward account not found for user ${userId}`);
      }

      const today = new Date();
      const lastCheckIn = rewardAccount.lastCheckInAt;

      if (lastCheckIn && this.isSameDay(today, lastCheckIn)) {
        throw new BadRequestException('Already checked in today');
      }

      const daysSinceLastCheckIn = lastCheckIn
        ? Math.floor((today.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24))
        : 1;

      const newStreak = daysSinceLastCheckIn === 1 ? rewardAccount.streak + 1 : 1;

      const CHECK_IN_POINTS = this.configService.get<number>('CHECK_IN_POINTS', 10);

      const [updatedAccount] = await this.prisma.$transaction([
        this.prisma.rewardAccount.update({
          where: { userId },
          data: {
            lastCheckInAt: today,
            lastLoginAt: today,
            points: { increment: CHECK_IN_POINTS },
            streak: newStreak,
          },
        }),
        this.prisma.pointsLedger.create({
          data: {
            userId,
            points: CHECK_IN_POINTS,
            reason: 'Daily check-in',
            type: 'credit',
          },
        }),
      ]);

      await this.invalidateRewardCache(userId);

      return {
        success: true,
        data: {
          message: 'Check-in successful',
          rewardAccount: {
            id: updatedAccount.id,
            userId: updatedAccount.userId,
            points: updatedAccount.points,
            levelId: updatedAccount.levelId,
            streak: updatedAccount.streak,
            lastLoginAt: updatedAccount.lastLoginAt,
            lastCheckInAt: updatedAccount.lastCheckInAt,
            createdAt: updatedAccount.createdAt,
            updatedAt: updatedAccount.updatedAt,
          },
        },
      };
    } catch (error) {
      this.logger.error(`checkIn failed: ${(error as Error).message}`, (error as Error).stack);
      return {
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: (error as Error).message },
      };
    }
  }

  private isSameDay(d1: Date, d2: Date): boolean {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  async earnPoints(userId: string, activity: string): Promise<RewardResponse> {
    try {
      const rewardAccount = await this.prisma.rewardAccount.findUnique({
        where: { userId },
      });

      if (!rewardAccount) {
        throw new NotFoundException(`Reward account not found for user ${userId}`);
      }

      const activityPoints = this.getActivityPoints(activity);

      await this.prisma.$transaction([
        this.prisma.rewardAccount.update({
          where: { userId },
          data: {
            points: { increment: activityPoints },
          },
        }),
        this.prisma.pointsLedger.create({
          data: {
            userId,
            points: activityPoints,
            reason: activity,
            type: 'credit',
          },
        }),
      ]);

      await this.invalidateRewardCache(userId);

      return {
        success: true,
        data: {
          message: 'Points earned successfully',
          activity,
          pointsEarned: activityPoints,
          newBalance: rewardAccount.points + activityPoints,
        },
      };
    } catch (error) {
      this.logger.error(`earnPoints failed: ${(error as Error).message}`, (error as Error).stack);
      return {
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: (error as Error).message },
      };
    }
  }

  private getActivityPoints(activity: string): number {
    const pointsMap: Record<string, number> = {
      content_view: 1,
      content_share: 5,
      content_like: 2,
      comment: 3,
      referral_signup: 50,
      daily_login: 5,
      profile_complete: 20,
    };
    const points = pointsMap[activity];
    if (!points) {
      throw new BadRequestException('Unknown activity');
    }
    return points;
  }

  async getBalance(userId: string): Promise<RewardResponse> {
    try {
      const cacheK = cacheKey('reward', `balance:${userId}`);
      const cached = await this.cacheService.get<RewardResponse>(cacheK);
      if (cached) return cached;

      const rewardAccount = await this.prisma.rewardAccount.findUnique({
        where: { userId },
        include: { level: true },
      });

      if (!rewardAccount) {
        throw new NotFoundException(`Reward account not found for user ${userId}`);
      }

      const result: RewardResponse = {
        success: true,
        data: {
          balance: rewardAccount.points,
          level: rewardAccount.level,
          userId,
        },
      };

      await this.cacheService.set(cacheK, result, 120);
      return result;
    } catch (error) {
      this.logger.error(`getBalance failed: ${(error as Error).message}`, (error as Error).stack);
      return {
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: (error as Error).message },
      };
    }
  }

  async getHistory(userId: string, page = 1, limit = 20): Promise<RewardResponse> {
    try {
      const skip = (page - 1) * limit;

      const [ledger, total] = await Promise.all([
        this.prisma.pointsLedger.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.pointsLedger.count({ where: { userId } }),
      ]);

      return {
        success: true,
        data: {
          history: ledger.map((entry) => ({
            id: entry.id,
            points: entry.points,
            type: entry.type,
            reason: entry.reason,
            createdAt: entry.createdAt,
          })),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error) {
      this.logger.error(`getHistory failed: ${(error as Error).message}`, (error as Error).stack);
      return {
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: (error as Error).message },
      };
    }
  }
}
