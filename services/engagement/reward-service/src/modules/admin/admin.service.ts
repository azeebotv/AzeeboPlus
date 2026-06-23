import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ApiResponseWrapper } from '@azeebo/shared-types';
import { Prisma } from '../../../generated/prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
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
  }

  async getRewards(options?: {
    page?: number;
    limit?: number;
    levelId?: string;
    minPoints?: number;
  }) {
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
          user: {
            select: { id: true, email: true, displayName: true },
          },
          level: true,
          badges: true,
        },
      }),
      this.prisma.rewardAccount.count({ where }),
    ]);

    return ApiResponseWrapper.paginated(accounts, page, limit, total);
  }

  async getRewardTransactions(id: string, options?: { page?: number; limit?: number }) {
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
  }

  async getMissions(options?: { type?: string; isActive?: string }) {
    const where: Record<string, unknown> = {};
    if (options?.type) where.type = options.type;
    if (options?.isActive !== undefined) where.isActive = options.isActive === 'true';

    const missions = await this.prisma.mission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { rewards: true },
    });

    return ApiResponseWrapper.success(missions);
  }

  async createMission(data: {
    title: string;
    description?: string;
    points: number;
    type: string;
    metadata?: Record<string, unknown>;
  }) {
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
  }
}
