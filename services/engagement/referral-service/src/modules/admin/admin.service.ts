import { Inject, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getStats() {
    try {
      const [referralCount, codeCount, rewardCount] = await Promise.all([
        this.prisma.referral.count(),
        this.prisma.referralCode.count(),
        this.prisma.referralReward.count(),
      ]);

      return {
        success: true,
        data: { referralCount, codeCount, rewardCount },
      };
    } catch (error) {
      this.logger.error(`getStats failed: ${(error as Error).message}`, (error as Error).stack);
      return { success: false, data: { message: (error as Error).message } };
    }
  }

  async getReferrals(page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const [referrals, total] = await Promise.all([
        this.prisma.referral.findMany({
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            referralCode: {
              select: { code: true },
            },
          },
        }),
        this.prisma.referral.count(),
      ]);

      return {
        success: true,
        data: {
          referrals: referrals.map((r) => ({
            id: r.id,
            referrerId: r.referrerId,
            referredId: r.referredId,
            code: r.referralCode.code,
            status: r.status,
            rewardAmount: r.rewardAmount ? Number(r.rewardAmount) : 0,
            rewardStatus: r.rewardStatus,
            completedAt: r.completedAt,
            createdAt: r.createdAt,
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
      this.logger.error(`getReferrals failed: ${(error as Error).message}`, (error as Error).stack);
      return { success: false, data: { message: (error as Error).message } };
    }
  }

  async getReferralConfig() {
    try {
      const configs = await this.prisma.referralConfig.findMany({
        orderBy: { key: 'asc' },
      });

      return {
        success: true,
        data: {
          configs: configs.map((c) => ({
            id: c.id,
            key: c.key,
            value: Number(c.value),
            description: c.description,
            isActive: c.isActive,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
          })),
        },
      };
    } catch (error) {
      this.logger.error(
        `getReferralConfig failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return { success: false, data: { message: (error as Error).message } };
    }
  }

  async updateReferralConfig(dto: {
    key: string;
    value?: number;
    description?: string;
    isActive?: boolean;
  }) {
    try {
      const existing = await this.prisma.referralConfig.findUnique({
        where: { key: dto.key },
      });

      if (!existing) {
        throw new NotFoundException(`Config with key "${dto.key}" not found`);
      }

      const updated = await this.prisma.referralConfig.update({
        where: { key: dto.key },
        data: {
          ...(dto.value !== undefined && { value: dto.value }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        },
      });

      return {
        success: true,
        data: {
          id: updated.id,
          key: updated.key,
          value: Number(updated.value),
          description: updated.description,
          isActive: updated.isActive,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        },
      };
    } catch (error) {
      this.logger.error(
        `updateReferralConfig failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      if (error instanceof NotFoundException) throw error;
      return { success: false, data: { message: (error as Error).message } };
    }
  }
}
