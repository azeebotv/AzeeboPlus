import { Inject, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ApiResponseWrapper } from '@azeebo/shared-types';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getStats() {
    try {
      const [totalAccounts, pointsDistributed, totalRedemptions] = await Promise.all([
        this.prisma.rewardAccount.count(),
        this.prisma.pointsLedger.aggregate({
          where: { type: 'credit' },
          _sum: { points: true },
        }),
        this.prisma.rewardRedemption.count(),
      ]);

      return ApiResponseWrapper.success({
        totalAccounts,
        pointsDistributed: pointsDistributed._sum.points || 0,
        totalRedemptions,
      });
    } catch (error) {
      this.logger.error(`getStats failed: ${(error as Error).message}`, (error as Error).stack);
      return ApiResponseWrapper.error('UNKNOWN_ERROR', (error as Error).message);
    }
  }

  async getRewards(options?: {
    page?: number;
    limit?: number;
    levelId?: string;
    minPoints?: number;
  }) {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {};
      if (options?.levelId) where.levelId = options.levelId;
      if (options?.minPoints) where.points = { gte: options.minPoints };

      const [accounts, total] = await Promise.all([
        this.prisma.rewardAccount.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            level: true,
            badges: true,
          },
        }),
        this.prisma.rewardAccount.count({ where }),
      ]);

      return ApiResponseWrapper.paginated(accounts, page, limit, total);
    } catch (error) {
      this.logger.error(`getRewards failed: ${(error as Error).message}`, (error as Error).stack);
      return ApiResponseWrapper.error('UNKNOWN_ERROR', (error as Error).message);
    }
  }

  async getRewardTransactions(id: string, options?: { page?: number; limit?: number }) {
    try {
      const account = await this.prisma.rewardAccount.findUnique({
        where: { id },
      });

      if (!account) {
        throw new NotFoundException('Reward account not found');
      }

      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const skip = (page - 1) * limit;

      const [transactions, total] = await Promise.all([
        this.prisma.pointsLedger.findMany({
          where: { userId: account.userId },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.pointsLedger.count({
          where: { userId: account.userId },
        }),
      ]);

      return ApiResponseWrapper.paginated(transactions, page, limit, total);
    } catch (error) {
      this.logger.error(
        `getRewardTransactions failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return ApiResponseWrapper.error('UNKNOWN_ERROR', (error as Error).message);
    }
  }

  async getMissions(options?: { type?: string; isActive?: string }) {
    try {
      const where: Record<string, unknown> = {};
      if (options?.type) where.type = options.type;
      if (options?.isActive !== undefined) where.isActive = options.isActive === 'true';

      const missions = await this.prisma.mission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { rewards: true },
      });

      return ApiResponseWrapper.success(missions);
    } catch (error) {
      this.logger.error(`getMissions failed: ${(error as Error).message}`, (error as Error).stack);
      return ApiResponseWrapper.error('UNKNOWN_ERROR', (error as Error).message);
    }
  }

  async createMission(data: {
    title: string;
    description?: string;
    points: number;
    type: string;
    metadata?: Record<string, unknown>;
  }) {
    try {
      const mission = await this.prisma.mission.create({
        data: {
          title: data.title,
          description: data.description,
          points: data.points,
          type: data.type,
          metadata: data.metadata as Prisma.InputJsonValue,
        },
      });

      return ApiResponseWrapper.created(mission);
    } catch (error) {
      this.logger.error(
        `createMission failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return ApiResponseWrapper.error('UNKNOWN_ERROR', (error as Error).message);
    }
  }

  async updateMission(
    id: string,
    data: {
      title?: string;
      description?: string;
      points?: number;
      type?: string;
      isActive?: boolean;
      metadata?: Record<string, unknown>;
    }
  ) {
    try {
      const existing = await this.prisma.mission.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException('Mission not found');
      }

      const updated = await this.prisma.mission.update({
        where: { id },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.points !== undefined && { points: data.points }),
          ...(data.type !== undefined && { type: data.type }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
          ...(data.metadata !== undefined && { metadata: data.metadata as Prisma.InputJsonValue }),
        },
      });

      return ApiResponseWrapper.success(updated);
    } catch (error) {
      this.logger.error(
        `updateMission failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return ApiResponseWrapper.error('UNKNOWN_ERROR', (error as Error).message);
    }
  }

  // Badge CRUD
  async getBadges(options?: { page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const [badges, total] = await Promise.all([
      this.prisma.badge.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.badge.count(),
    ]);

    return ApiResponseWrapper.success({ badges, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  }

  async createBadge(data: { name: string; description?: string; icon?: string; criteria?: string; points: number }) {
    const badge = await this.prisma.badge.create({ data });
    return ApiResponseWrapper.created(badge);
  }

  async assignBadge(badgeId: string, userId: string, reason?: string) {
    const badge = await this.prisma.badge.findUnique({ where: { id: badgeId } });
    if (!badge) throw new NotFoundException('Badge not found');

    // Update the badge's points ledger for the user
    await this.prisma.pointsLedger.create({
      data: {
        userId,
        points: badge.points,
        type: 'badge',
        description: `Badge awarded: ${badge.name}${reason ? ` - ${reason}` : ''}`,
      },
    });

    return ApiResponseWrapper.success({ message: `Badge ${badge.name} assigned to user ${userId}` });
  }

  // Level CRUD
  async getLevels() {
    const levels = await this.prisma.level.findMany({ orderBy: { minPoints: 'asc' } });
    return ApiResponseWrapper.success(levels);
  }

  async createLevel(data: { name: string; minPoints: number; maxPoints?: number; perks?: string }) {
    const level = await this.prisma.level.create({ data });
    return ApiResponseWrapper.created(level);
  }

  async updateLevel(id: string, data: { name?: string; minPoints?: number; maxPoints?: number; perks?: string }) {
    const existing = await this.prisma.level.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Level not found');

    const updated = await this.prisma.level.update({ where: { id }, data });
    return ApiResponseWrapper.success(updated);
  }
}
