import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import {
  ReferralResponse,
  ReferralStats,
  PaginationData,
} from './interfaces/referral-response.interface';
import { GenerateReferralCodeDto, ApplyReferralCodeDto } from './dto/referral.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class ReferralService {
  private readonly defaultPaginationLimit: number;
  private readonly defaultReferralReward: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {
    this.defaultPaginationLimit = this.configService.get<number>('DEFAULT_PAGINATION_LIMIT', 20);
    this.defaultReferralReward = this.configService.get<number>('DEFAULT_REFERRAL_REWARD', 50);
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

    const code = this.generateCode();

    const referralCode = await this.prisma.referralCode.create({
      data: {
        userId,
        code,
        maxUses: dto.maxUses || null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

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

    const referral = await this.prisma.referral.create({
      data: {
        referrerId: referralCode.userId,
        referredId,
        referralCodeId: referralCode.id,
        status: 'pending',
      },
    });

    await this.prisma.referralCode.update({
      where: { id: referralCode.id },
      data: {
        currentUses: { increment: 1 },
      },
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

    return {
      success: true,
      data: { stats },
    };
  }

  async completeReferral(referralId: string, userId: string): Promise<ReferralResponse> {
    const referral = await this.prisma.referral.findUnique({
      where: { id: referralId },
    });

    if (!referral) {
      throw new NotFoundException('Referral not found');
    }

    // Only the referrer or referee can complete a referral
    if (referral.referrerId !== userId && referral.referredId !== userId) {
      throw new BadRequestException('Not authorized to complete this referral');
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
          rewardStatus: 'pending',
          completedAt: new Date(),
        },
      });

      await tx.referralReward.create({
        data: {
          referralId,
          userId: referral.referrerId,
          amount: rewardAmount,
          type: 'signup',
          status: 'pending',
        },
      });
    });

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
    const referralCode = await this.prisma.referralCode.findFirst({
      where: { userId, isActive: true },
    });

    if (!referralCode) {
      return {
        success: true,
        data: { referralCode: null },
      };
    }

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
  }

  private generateCode(): string {
    const prefix = 'AZB';
    const random = randomBytes(4).toString('hex').toUpperCase();
    return `${prefix}-${random}`;
  }

  private async getReferralRewardAmount(): Promise<number> {
    const config = await this.prisma.referralConfig.findUnique({
      where: { key: 'signup_reward' },
    });

    return config ? Number(config.value) : this.defaultReferralReward;
  }
}
