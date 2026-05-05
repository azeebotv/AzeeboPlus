import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class RewardsService {
  private readonly defaultPaginationLimit = 100;

  constructor(private readonly prisma: PrismaService) {}

  async getRewardAccount(userId: string) {
    const rewardAccount = await this.prisma.rewardAccount.findUnique({
      where: { userId },
      include: {
        badges: true,
        level: true,
      },
    });

    if (!rewardAccount) {
      // Create new reward account for user
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
        data: newAccount,
      };
    }

    return {
      success: true,
      data: rewardAccount,
    };
  }

  async getMissions(userId: string, limit = this.defaultPaginationLimit) {
    const missions = await this.prisma.mission.findMany({
      where: { isActive: true },
      include: {
        rewards: true,
      },
      take: limit,
    });

    // Get user's completed missions
    const completedMissions = await this.prisma.missionCompletion.findMany({
      where: { userId },
      select: { missionId: true },
    });

    const completedMissionIds = completedMissions.map((m) => m.missionId);

    return {
      success: true,
      data: {
        missions: missions.map((mission) => ({
          ...mission,
          isCompleted: completedMissionIds.includes(mission.id),
        })),
      },
    };
  }

  async getBadges(userId: string) {
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
      data: badges,
    };
  }

  async getStreak(userId: string) {
    const rewardAccount = await this.prisma.rewardAccount.findUnique({
      where: { userId },
    });

    if (!rewardAccount) {
      throw new NotFoundException(`Reward account not found for user ${userId}`);
    }

    const today = new Date();
    const lastLogin = rewardAccount.lastLoginAt;
    const daysSinceLastLogin = Math.floor(
      (today.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24),
    );

    let currentStreak = rewardAccount.streak;

    if (daysSinceLastLogin === 1) {
      // User logged in after a day's break
      currentStreak = 1;
    } else if (daysSinceLastLogin === 0) {
      // User logged in today
      currentStreak = rewardAccount.streak;
    } else if (daysSinceLastLogin > 1) {
      // User missed a day, streak is broken
      currentStreak = 0;
    }

    return {
      success: true,
      data: {
        streak: currentStreak,
        lastLoginAt: rewardAccount.lastLoginAt,
        streakBreakDate: daysSinceLastLogin > 1 ? lastLogin : null,
      },
    };
  }

  async redeemReward(userId: string, rewardId: string) {
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

    // Deduct points
    await this.prisma.rewardAccount.update({
      where: { userId },
      data: {
        points: { decrement: reward.cost },
      },
    });

    // Record redemption
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
        reward,
        remainingPoints: rewardAccount.points - reward.cost,
      },
    };
  }

  async getLevel(userId: string) {
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
        currentLevel: rewardAccount.level,
        nextLevel,
        pointsToNextLevel: nextLevel ? nextLevel.minPoints - rewardAccount.points : 0,
      },
    };
  }

  async addPoints(userId: string, points: number, reason: string) {
    const rewardAccount = await this.prisma.rewardAccount.findUnique({
      where: { userId },
    });

    if (!rewardAccount) {
      throw new NotFoundException(`Reward account not found for user ${userId}`);
    }

    // Add points
    await this.prisma.rewardAccount.update({
      where: { userId },
      data: {
        points: { increment: points },
      },
    });

    // Record points ledger
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
        newPoints: rewardAccount.points + points,
      },
    };
  }

  async checkIn(userId: string) {
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

    // Update last check-in
    await this.prisma.rewardAccount.update({
      where: { userId },
      data: {
        lastCheckInAt: today,
        lastLoginAt: today,
      },
    });

    // Add check-in points
    await this.addPoints(userId, 10, 'Daily check-in');

    // Update streak
    const daysSinceLastCheckIn = lastCheckIn
      ? Math.floor((today.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24))
      : 1;

    if (daysSinceLastCheckIn === 1) {
      // Continue streak
      await this.prisma.rewardAccount.update({
        where: { userId },
        data: {
          streak: { increment: 1 },
        },
      });
    } else if (daysSinceLastCheckIn > 1) {
      // Reset streak
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
        pointsEarned: 10,
        streak: daysSinceLastCheckIn === 1 ? rewardAccount.streak + 1 : 1,
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
}
