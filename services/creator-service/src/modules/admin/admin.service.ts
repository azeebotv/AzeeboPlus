import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getCreatorStats() {
    const [totalCreators, verifiedCreators, totalEarnings, pendingPayouts] = await Promise.all([
      this.prisma.creatorProfile.count(),
      this.prisma.creatorProfile.count({ where: { verified: true } }),
      this.prisma.creatorEarning.aggregate({
        _sum: { amount: true },
        where: { status: 'paid' },
      }),
      this.prisma.payoutRequest.count({ where: { status: 'pending' } }),
    ]);

    return {
      totalCreators,
      verifiedCreators,
      totalEarnings: totalEarnings._sum.amount || 0,
      pendingPayouts,
    };
  }

  async getAllCreators(options?: { page?: number; limit?: number; verified?: boolean }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (options?.verified !== undefined) where.verified = options.verified;

    const [creators, total] = await Promise.all([
      this.prisma.creatorProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          earnings: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
          subscriptions: {
            where: { status: 'active' },
          },
        },
      }),
      this.prisma.creatorProfile.count({ where }),
    ]);

    return {
      creators,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCreatorById(creatorId: string) {
    const creator = await this.prisma.creatorProfile.findUnique({
      where: { id: creatorId },
      include: {
        earnings: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        subscriptions: true,
        channels: true,
        challenges: true,
        payoutRequests: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!creator) {
      throw new NotFoundException('Creator not found');
    }

    return creator;
  }

  async getCreatorByUserId(userId: string) {
    const creator = await this.prisma.creatorProfile.findUnique({
      where: { userId },
      include: {
        earnings: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        subscriptions: true,
        channels: true,
      },
    });

    if (!creator) {
      throw new NotFoundException('Creator not found for user');
    }

    return creator;
  }

  async verifyCreator(creatorId: string) {
    const creator = await this.prisma.creatorProfile.findUnique({ where: { id: creatorId } });
    if (!creator) {
      throw new NotFoundException('Creator not found');
    }

    return this.prisma.creatorProfile.update({
      where: { id: creatorId },
      data: { verified: true },
    });
  }

  async unverifyCreator(creatorId: string) {
    const creator = await this.prisma.creatorProfile.findUnique({ where: { id: creatorId } });
    if (!creator) {
      throw new NotFoundException('Creator not found');
    }

    return this.prisma.creatorProfile.update({
      where: { id: creatorId },
      data: { verified: false },
    });
  }

  async getCreatorEarnings(creatorId: string, options?: { page?: number; limit?: number; type?: string }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { creatorId };
    if (options?.type) {
      where.type = options.type;
    }

    const [earnings, total] = await Promise.all([
      this.prisma.creatorEarning.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.creatorEarning.count({ where }),
    ]);

    return {
      earnings,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPayoutRequests(options?: { page?: number; limit?: number; status?: string }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (options?.status) {
      where.status = options.status;
    }

    const [payouts, total] = await Promise.all([
      this.prisma.payoutRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: true,
        },
      }),
      this.prisma.payoutRequest.count({ where }),
    ]);

    return {
      payouts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
