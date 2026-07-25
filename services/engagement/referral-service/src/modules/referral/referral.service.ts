import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service.js';
import { CacheService, cacheKey } from '@azeebo/shared-services';
import { Prisma } from '@prisma/client';
import {
  ReferralResponse,
  ReferralStats,
  PaginationData,
} from './interfaces/referral-response.interface.js';
import { GenerateReferralCodeDto, ApplyReferralCodeDto } from './dto/referral.dto.js';
import { randomBytes } from 'crypto';
import axios from 'axios';

@Injectable()
export class ReferralService {
  private readonly logger = new Logger(ReferralService.name);
  private readonly defaultPaginationLimit: number;
  private readonly defaultReferralReward: number;
  private readonly analyticsServiceBaseUrl: string;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CacheService) private readonly cache: CacheService,
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {
    this.defaultPaginationLimit = this.configService.get<number>('DEFAULT_PAGINATION_LIMIT', 20);
    this.defaultReferralReward = this.configService.get<number>('DEFAULT_REFERRAL_REWARD', 50);
    this.analyticsServiceBaseUrl = this.configService.get<string>(
      'ANALYTICS_SERVICE_URL',
      'http://analytics-service:3040'
    );
  }

  private async trackAnalyticsEvent(
    eventName: string,
    userId: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    try {
      await axios.post(
        `${this.analyticsServiceBaseUrl}/analytics/track`,
        { eventName, userId, metadata, timestamp: new Date().toISOString() },
        { timeout: 10000 }
      );
    } catch (error) {
      this.logger.warn(`Failed to track analytics event: ${eventName}`);
    }
  }

  async generateReferralCode(
    userId: string,
    dto: GenerateReferralCodeDto
  ): Promise<ReferralResponse> {
    const existingCode = await this.prisma.referralCode.findFirst({
      where: { userId, isActive: true },
    });

    if (existingCode) {
      return {
        success: true,
        data: {
          referralCode: {
            id: existingCode.id,
            code: existingCode.code,
            isActive: existingCode.isActive,
            maxUses: existingCode.maxUses,
            currentUses: existingCode.currentUses,
            expiresAt: existingCode.expiresAt,
            createdAt: existingCode.createdAt,
            updatedAt: existingCode.updatedAt,
          },
        },
      };
    }

    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const code = this.generateCode();
      try {
        const referralCode = await this.prisma.referralCode.create({
          data: {
            userId,
            code,
            maxUses: dto.maxUses || null,
            expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
          },
        });

        await this.cache.invalidate(`referral:code:${userId}`);

        this.trackAnalyticsEvent('referral_code_generated', userId, { code });

        return {
          success: true,
          data: {
            referralCode: {
              id: referralCode.id,
              code: referralCode.code,
              isActive: referralCode.isActive,
              maxUses: referralCode.maxUses,
              currentUses: referralCode.currentUses,
              expiresAt: referralCode.expiresAt,
              createdAt: referralCode.createdAt,
              updatedAt: referralCode.updatedAt,
            },
          },
        };
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          continue;
        }
        throw error;
      }
    }

    throw new BadRequestException(
      'Failed to generate unique referral code after multiple attempts'
    );
  }

  async applyReferralCode(
    referredId: string,
    dto: ApplyReferralCodeDto
  ): Promise<ReferralResponse> {
    const referralCode = await this.prisma.referralCode.findUnique({
      where: { code: dto.code },
    });

    if (!referralCode) {
      throw new NotFoundException('Invalid referral code');
    }

    if (!referralCode.isActive) {
      throw new BadRequestException('Referral code is no longer active');
    }

    if (referralCode.expiresAt && referralCode.expiresAt < new Date()) {
      throw new BadRequestException('Referral code has expired');
    }

    if (referralCode.maxUses && referralCode.currentUses >= referralCode.maxUses) {
      throw new BadRequestException('Referral code has reached maximum uses');
    }

    if (referralCode.userId === referredId) {
      throw new BadRequestException('Cannot use your own referral code');
    }

    const existingReferral = await this.prisma.referral.findFirst({
      where: { referredId },
    });

    if (existingReferral) {
      throw new ConflictException('You have already used a referral code');
    }

    const referral = await this.prisma.$transaction(async (tx) => {
      const newReferral = await tx.referral.create({
        data: {
          referrerId: referralCode.userId,
          referredId,
          referralCodeId: referralCode.id,
          status: 'pending',
        },
      });

      // Deliberate use of raw SQL for atomic compare-and-increment.
      // Prisma's update API lacks a conditional WHERE on the increment,
      // so $executeRaw ensures currentUses is only bumped when below maxUses,
      // preventing race-condition overuse of referral codes.
      const affectedRows = await tx.$executeRaw`
        UPDATE "referral_codes" SET "currentUses" = "currentUses" + 1
        WHERE "id" = ${referralCode.id} AND "currentUses" < ${referralCode.maxUses ?? 2147483647}
      `;

      if (affectedRows === 0) {
        throw new BadRequestException('Referral code has reached maximum uses');
      }

      return newReferral;
    });

    await this.cache.invalidate(`referral:code:${referredId}`);
    await this.cache.invalidate(`referral:stats:${referralCode.userId}`);

    this.trackAnalyticsEvent('referral_applied', referredId, {
      code: dto.code,
      referrerId: referralCode.userId,
    });

    return {
      success: true,
      data: {
        message: 'Referral code applied successfully',
        referral: {
          id: referral.id,
          referrerId: referral.referrerId,
          referredId: referral.referredId,
          status: referral.status,
          createdAt: referral.createdAt,
        },
      },
    };
  }

  async getReferrals(
    userId: string,
    page = 1,
    limit = this.defaultPaginationLimit
  ): Promise<ReferralResponse> {
    const skip = (page - 1) * limit;

    const [referrals, total] = await Promise.all([
      this.prisma.referral.findMany({
        where: { referrerId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.referral.count({ where: { referrerId: userId } }),
    ]);

    const pagination: PaginationData = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    return {
      success: true,
      data: {
        referrals: referrals.map((referral) => ({
          id: referral.id,
          referredId: referral.referredId,
          status: referral.status,
          rewardAmount: referral.rewardAmount ? Number(referral.rewardAmount) : 0,
          rewardStatus: referral.rewardStatus,
          completedAt: referral.completedAt,
          createdAt: referral.createdAt,
        })),
        pagination,
      },
    };
  }

  async getStats(userId: string): Promise<ReferralResponse> {
    const cacheK = cacheKey('referral', `stats:${userId}`);
    const cached = await this.cache.get<ReferralResponse>(cacheK);
    if (cached) return cached;

    const [totalReferrals, completedReferrals, pendingReferrals, totalRewards] = await Promise.all([
      this.prisma.referral.count({ where: { referrerId: userId } }),
      this.prisma.referral.count({ where: { referrerId: userId, status: 'completed' } }),
      this.prisma.referral.count({ where: { referrerId: userId, status: 'pending' } }),
      this.prisma.referralReward.aggregate({
        where: { userId, status: 'credited' },
        _sum: { amount: true },
      }),
    ]);

    const referralCode = await this.prisma.referralCode.findFirst({
      where: { userId, isActive: true },
      select: { code: true },
    });

    const stats: ReferralStats = {
      totalReferrals,
      completedReferrals,
      pendingReferrals,
      totalRewards: Number(totalRewards._sum.amount) || 0,
      referralCode: referralCode?.code || '',
    };

    const result: ReferralResponse = {
      success: true,
      data: { stats },
    };

    await this.cache.set(cacheK, result, 300);
    return result;
  }

  async completeReferral(referralId: string, userId: string): Promise<ReferralResponse> {
    const referral = await this.prisma.referral.findUnique({
      where: { id: referralId },
    });

    if (!referral) {
      throw new NotFoundException('Referral not found');
    }

    // Only the referrer can complete a referral
    if (referral.referrerId !== userId) {
      throw new NotFoundException('Referral not found');
    }

    if (referral.referrerId === referral.referredId) {
      throw new BadRequestException('Self-referral not allowed');
    }

    if (referral.status === 'completed') {
      throw new BadRequestException('Referral already completed');
    }

    const rewardAmount = await this.getReferralRewardAmount();

    await this.prisma.$transaction(async (tx) => {
      await tx.referral.update({
        where: { id: referralId },
        data: {
          status: 'completed',
          rewardAmount,
          rewardStatus: 'credited',
          completedAt: new Date(),
        },
      });

      await tx.referralReward.create({
        data: {
          referralId,
          userId: referral.referrerId,
          amount: rewardAmount,
          type: 'signup',
          status: 'credited',
        },
      });

      // Credit the referrer's reward account (if models exist)
      try {
        const rewardAccount = await (
          tx as unknown as {
            rewardAccount?: { findUnique: (args: unknown) => Promise<{ userId: string } | null> };
          }
        ).rewardAccount?.findUnique({
          where: { userId: referral.referrerId },
        });

        if (rewardAccount) {
          await (
            tx as unknown as { rewardAccount?: { update: (args: unknown) => Promise<unknown> } }
          ).rewardAccount?.update({
            where: { userId: referral.referrerId },
            data: {
              totalPoints: { increment: Number(rewardAmount) },
              availablePoints: { increment: Number(rewardAmount) },
            },
          });

          await (
            tx as unknown as { pointsLedger?: { create: (args: unknown) => Promise<unknown> } }
          ).pointsLedger?.create({
            data: {
              userId: referral.referrerId,
              points: Number(rewardAmount),
              type: 'referral',
              reason: `Referral completed: ${referralId}`,
            },
          });
        }
      } catch {
        // rewardAccount/pointsLedger models may not exist
      }
    });

    await this.cache.invalidate(`referral:stats:${referral.referrerId}`);

    return {
      success: true,
      data: {
        message: 'Referral completed successfully',
        referralId,
        rewardAmount: Number(rewardAmount),
      },
    };
  }

  async getReferralCode(userId: string): Promise<ReferralResponse> {
    const cacheK = cacheKey('referral', `code:${userId}`);
    const cached = await this.cache.get<ReferralResponse>(cacheK);
    if (cached) return cached;

    const referralCode = await this.prisma.referralCode.findFirst({
      where: { userId, isActive: true },
    });

    const result: ReferralResponse = !referralCode
      ? {
          success: true,
          data: { referralCode: null },
        }
      : {
          success: true,
          data: {
            referralCode: {
              id: referralCode.id,
              code: referralCode.code,
              isActive: referralCode.isActive,
              maxUses: referralCode.maxUses,
              currentUses: referralCode.currentUses,
              expiresAt: referralCode.expiresAt,
              createdAt: referralCode.createdAt,
              updatedAt: referralCode.updatedAt,
            },
          },
        };

    await this.cache.set(cacheK, result, 300);
    return result;
  }

  private generateCode(): string {
    const prefix = 'AZB';
    const random = randomBytes(8).toString('hex').toUpperCase();
    return `${prefix}-${random}`;
  }

  private async getReferralRewardAmount(): Promise<number> {
    const config = await this.prisma.referralConfig.findUnique({
      where: { key: 'signup_reward' },
    });

    return config ? Number(config.value) : this.defaultReferralReward;
  }
}
