import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  constructor(private prisma: PrismaService) {}

  async getCreatorStats() {
    try {
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
    } catch (error) {
      this.logger.error(`Failed to get creator stats: ${error.message}`, error.stack);
      return { success: false, error: error.message };
    }
  }

  async getAllCreators(options?: { page?: number; limit?: number; verified?: boolean }) {
    try {
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
    } catch (error) {
      this.logger.error(`Failed to get all creators: ${error.message}`, error.stack);
      return { success: false, error: error.message };
    }
  }

  async getCreatorById(creatorId: string) {
    try {
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
    } catch (error) {
      this.logger.error(`Failed to get creator by id: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      return { success: false, error: error.message };
    }
  }

  async getCreatorByUserId(userId: string) {
    try {
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
    } catch (error) {
      this.logger.error(`Failed to get creator by user id: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      return { success: false, error: error.message };
    }
  }

  async verifyCreator(creatorId: string) {
    try {
      const creator = await this.prisma.creatorProfile.findUnique({ where: { id: creatorId } });
      if (!creator) {
        throw new NotFoundException('Creator not found');
      }

      return this.prisma.creatorProfile.update({
        where: { id: creatorId },
        data: { verified: true },
      });
    } catch (error) {
      this.logger.error(`Failed to verify creator: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      return { success: false, error: error.message };
    }
  }

  async unverifyCreator(creatorId: string) {
    try {
      const creator = await this.prisma.creatorProfile.findUnique({ where: { id: creatorId } });
      if (!creator) {
        throw new NotFoundException('Creator not found');
      }

      return this.prisma.creatorProfile.update({
        where: { id: creatorId },
        data: { verified: false },
      });
    } catch (error) {
      this.logger.error(`Failed to unverify creator: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      return { success: false, error: error.message };
    }
  }

  async getCreatorEarnings(
    creatorId: string,
    options?: { page?: number; limit?: number; type?: string }
  ) {
    try {
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
    } catch (error) {
      this.logger.error(`Failed to get creator earnings: ${error.message}`, error.stack);
      return { success: false, error: error.message };
    }
  }

  async getPayoutRequests(options?: { page?: number; limit?: number; status?: string }) {
    try {
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
    } catch (error) {
      this.logger.error(`Failed to get payout requests: ${error.message}`, error.stack);
      return { success: false, error: error.message };
    }
  }
}
