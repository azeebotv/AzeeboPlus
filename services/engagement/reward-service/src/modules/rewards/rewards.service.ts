import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RewardResponse } from './interfaces/reward-response.interface';

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
  private readonly defaultPaginationLimit = 100;

  constructor(private readonly prisma: PrismaService) {}

  async getRewardAccount(userId: string): Promise<RewardResponse> {
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
  }

  async getMissions(userId: string, limit = this.defaultPaginationLimit): Promise<RewardResponse> {
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

    return {
      success: true,
      data: {
        missions: missionsWithCompletion,
      },
    };
  }

  async getBadges(userId: string): Promise<RewardResponse> {
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

    return {
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
  }

  async getStreak(userId: string): Promise<RewardResponse> {
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
      currentStreak = 1;
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
  }

  async redeemReward(userId: string, rewardId: string): Promise<RewardResponse> {
    const rewardAccount = await this.prisma.rewardAccount.findUnique({
      where: { userId },
    });

    if (!rewardAccount) {
      throw new NotFoundException(`Reward account not found for user ${userId}`);
    }

    const reward = await this.prisma.reward.findUnique({
      where: { id: rewardId },
    });

    if (!reward) {
      throw new NotFoundException(`Reward not found`);
    }

    if (rewardAccount.points < reward.cost) {
      throw new BadRequestException('Insufficient points');
    }

    await this.prisma.rewardAccount.update({
      where: { userId },
      data: {
        points: { decrement: reward.cost },
      },
    });

    await this.prisma.rewardRedemption.create({
      data: {
        userId,
        rewardId,
        pointsCost: reward.cost,
      },
    });

    return {
      success: true,
      data: {
        message: 'Reward redeemed successfully',
        rewardAccount: {
          id: rewardAccount.id,
          userId: rewardAccount.userId,
          points: rewardAccount.points - reward.cost,
          levelId: rewardAccount.levelId,
          streak: rewardAccount.streak,
          lastLoginAt: rewardAccount.lastLoginAt,
          lastCheckInAt: rewardAccount.lastCheckInAt,
          createdAt: rewardAccount.createdAt,
          updatedAt: rewardAccount.updatedAt,
        },
      },
    };
  }

  async getLevel(userId: string): Promise<RewardResponse> {
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
  }

  async addPoints(userId: string, points: number, reason: string): Promise<RewardResponse> {
    const rewardAccount = await this.prisma.rewardAccount.findUnique({
      where: { userId },
    });

    if (!rewardAccount) {
      throw new NotFoundException(`Reward account not found for user ${userId}`);
    }

    await this.prisma.rewardAccount.update({
      where: { userId },
      data: {
        points: { increment: points },
      },
    });

    await this.prisma.pointsLedger.create({
      data: {
        userId,
        points,
        reason,
        type: 'credit',
      },
    });

    return {
      success: true,
      data: {
        message: 'Points added successfully',
        rewardAccount: {
          id: rewardAccount.id,
          userId: rewardAccount.userId,
          points: rewardAccount.points + points,
          levelId: rewardAccount.levelId,
          streak: rewardAccount.streak,
          lastLoginAt: rewardAccount.lastLoginAt,
          lastCheckInAt: rewardAccount.lastCheckInAt,
          createdAt: rewardAccount.createdAt,
          updatedAt: rewardAccount.updatedAt,
        },
      },
    };
  }

  async checkIn(userId: string): Promise<RewardResponse> {
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

    await this.prisma.rewardAccount.update({
      where: { userId },
      data: {
        lastCheckInAt: today,
        lastLoginAt: today,
      },
    });

    await this.addPoints(userId, 10, 'Daily check-in');

    const daysSinceLastCheckIn = lastCheckIn
      ? Math.floor((today.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24))
      : 1;

    if (daysSinceLastCheckIn === 1) {
      await this.prisma.rewardAccount.update({
        where: { userId },
        data: {
          streak: { increment: 1 },
        },
      });
    } else if (daysSinceLastCheckIn > 1) {
      await this.prisma.rewardAccount.update({
        where: { userId },
        data: {
          streak: 1,
        },
      });
    }

    return {
      success: true,
      data: {
        message: 'Check-in successful',
        rewardAccount: {
          id: rewardAccount.id,
          userId: rewardAccount.userId,
          points: rewardAccount.points + 10,
          levelId: rewardAccount.levelId,
          streak: daysSinceLastCheckIn === 1 ? rewardAccount.streak + 1 : 1,
          lastLoginAt: today,
          lastCheckInAt: today,
          createdAt: rewardAccount.createdAt,
          updatedAt: rewardAccount.updatedAt,
        },
      },
    };
  }

  private isSameDay(d1: Date, d2: Date): boolean {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  async earnPoints(userId: string, activity: string, amount?: number): Promise<RewardResponse> {
    const rewardAccount = await this.prisma.rewardAccount.findUnique({
      where: { userId },
    });

    if (!rewardAccount) {
      throw new NotFoundException(`Reward account not found for user ${userId}`);
    }

    const activityPoints = amount || this.getActivityPoints(activity);

    await this.prisma.rewardAccount.update({
      where: { userId },
      data: {
        points: { increment: activityPoints },
      },
    });

    await this.prisma.pointsLedger.create({
      data: {
        userId,
        points: activityPoints,
        reason: activity,
        type: 'credit',
      },
    });

    return {
      success: true,
      data: {
        message: 'Points earned successfully',
        activity,
        pointsEarned: activityPoints,
        newBalance: rewardAccount.points + activityPoints,
      },
    };
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
    return pointsMap[activity] || 1;
  }

  async getBalance(userId: string): Promise<RewardResponse> {
    const rewardAccount = await this.prisma.rewardAccount.findUnique({
      where: { userId },
      include: { level: true },
    });

    if (!rewardAccount) {
      throw new NotFoundException(`Reward account not found for user ${userId}`);
    }

    return {
      success: true,
      data: {
        balance: rewardAccount.points,
        level: rewardAccount.level,
        userId,
      },
    };
  }

  async getHistory(userId: string, page = 1, limit = 20): Promise<RewardResponse> {
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
        history: ledger.map(entry => ({
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
  }
}
