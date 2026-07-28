import { Inject, Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '@prisma/client';
import { CreatorResponse } from './interfaces/creator-response.interface.js';
import axios from 'axios';
import { randomUUID } from 'crypto';
import { CacheService, cacheKey } from '@azeebo/shared-services';

interface UpdateProfileData {
  displayName?: string;
  bio?: string;
  avatar?: string;
  banner?: string;
  socialLinks?: Record<string, string>;
}

interface CreateUploadData {
  title: string;
  description?: string;
  thumbnail?: string;
  mediaUrl?: string;
}

interface ChannelData {
  name: string;
  description?: string;
  category?: string;
}

interface ChallengeData {
  title: string;
  description: string;
  prize: string;
  startDate: Date;
  endDate: Date;
}

interface PayoutRequestData {
  amount: number;
  method: string;
  accountDetails: Record<string, string>;
}

@Injectable()
export class CreatorsService {
  private readonly logger = new Logger(CreatorsService.name);
  private readonly walletServiceBaseUrl: string;
  private readonly mediaServiceBaseUrl: string;
  private readonly analyticsServiceBaseUrl: string;
  private readonly notificationServiceBaseUrl: string;
  private readonly minimumPayout: number;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(CacheService) private readonly cache: CacheService
  ) {
    this.walletServiceBaseUrl = this.configService.getOrThrow<string>('WALLET_SERVICE_URL');
    this.mediaServiceBaseUrl = this.configService.getOrThrow<string>('MEDIA_SERVICE_URL');
    this.analyticsServiceBaseUrl = this.configService.getOrThrow<string>('ANALYTICS_SERVICE_URL');
    this.notificationServiceBaseUrl = this.configService.get<string>(
      'NOTIFICATION_SERVICE_URL',
      'http://notification-service:3006'
    );
    this.minimumPayout = parseInt(this.configService.get<string>('MINIMUM_PAYOUT', '5000'), 10);
  }

  private async trackAnalyticsEvent(
    eventName: string,
    userId: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    try {
      await axios.post(`${this.analyticsServiceBaseUrl}/analytics/track`, {
        eventName,
        userId,
        universe: 'creator',
        metadata,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Failed to track analytics event:', error);
    }
  }

  async onboard(userId: string): Promise<CreatorResponse> {
    const existingProfile = await this.prisma.creatorProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      throw new BadRequestException('Creator profile already exists');
    }

    const profile = await this.prisma.$transaction(async (tx) => {
      const creatorProfile = await tx.creatorProfile.create({
        data: {
          userId,
          bio: '',
          verified: false,
        },
      });

      return creatorProfile;
    });

    // Send welcome notification via notification service (outside transaction)
    try {
      await axios.post(
        `${this.notificationServiceBaseUrl}/v1/notifications`,
        {
          userId,
          type: 'system',
          title: 'Welcome to Creator Program',
          message:
            'Your creator profile has been created. Complete verification to unlock all features.',
        },
        { timeout: 5000 }
      );
    } catch (error) {
      this.logger.warn('Failed to send welcome notification:', error);
    }

    await this.trackAnalyticsEvent('creator_onboarded', userId, {});

    await this.cache.invalidate(`creator:profile:${userId}*`);

    return {
      success: true,
      data: profile,
    };
  }

  async submitVerification(
    userId: string,
    documents: { type: string; url: string }[]
  ): Promise<CreatorResponse> {
    const profile = await this.prisma.creatorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Creator profile not found');
    }

    const verificationRecord = await this.prisma.$transaction(async (tx) => {
      const doc = await tx.verificationDocument.create({
        data: {
          userId,
          documentType: documents[0]?.type || 'identity',
          documentUrl: documents[0]?.url || '',
          status: 'pending',
          metadata: documents as Prisma.InputJsonValue,
        },
      });

      await tx.notification.create({
        data: {
          userId,
          type: 'system',
          title: 'Verification Submitted',
          message: 'Your verification documents have been submitted for review.',
          metadata: { documents, verificationId: doc.id } as Prisma.InputJsonValue,
        },
      });

      return doc;
    });

    await this.trackAnalyticsEvent('verification_submitted', userId, {
      documentCount: documents.length,
      verificationId: verificationRecord.id,
    });

    return {
      success: true,
      data: {
        verificationId: verificationRecord.id,
        message: 'Verification documents submitted for review',
        status: 'pending',
      },
    };
  }

  async getVerificationStatus(userId: string): Promise<CreatorResponse> {
    const profile = await this.prisma.creatorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Creator profile not found');
    }

    const latestVerification = await this.prisma.verificationDocument.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: {
        verified: profile.verified,
        verificationStatus: latestVerification?.status || 'not_submitted',
        message: profile.verified ? 'Creator is verified' : 'Verification pending or not submitted',
        submittedAt: latestVerification?.createdAt,
      },
    };
  }

  async approveVerification(creatorId: string, adminId: string): Promise<CreatorResponse> {
    const profile = await this.prisma.creatorProfile.findUnique({
      where: { userId: creatorId },
    });

    if (!profile) {
      throw new NotFoundException('Creator profile not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.creatorProfile.update({
        where: { userId: creatorId },
        data: { verified: true },
      });

      await tx.verificationDocument.updateMany({
        where: { userId: creatorId, status: 'pending' },
        data: { status: 'approved', reviewedBy: adminId, reviewedAt: new Date() },
      });

      await tx.notification.create({
        data: {
          userId: creatorId,
          type: 'system',
          title: 'Verification Approved',
          message: 'Congratulations! Your creator account has been verified.',
        },
      });
    });

    await this.trackAnalyticsEvent('verification_approved', creatorId, {
      approvedBy: adminId,
    });

    await this.cache.invalidate(`creator:profile:${creatorId}*`);

    return {
      success: true,
      data: {
        message: 'Creator verification approved',
        verified: true,
      },
    };
  }

  async uploadMedia(
    userId: string,
    data: { fileName: string; mimeType: string; size: number }
  ): Promise<CreatorResponse> {
    const profile = await this.prisma.creatorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Creator profile not found');
    }

    const uploadId = randomUUID();

    const upload = await this.prisma.mediaUpload.create({
      data: {
        userId,
        fileName: data.fileName,
        mimeType: data.mimeType,
        size: data.size,
        status: 'pending',
        uploadId,
      },
    });

    try {
      const response = await axios
        .post(`${this.mediaServiceBaseUrl}/upload/presigned`, {
          fileName: data.fileName,
          mimeType: data.mimeType,
          size: data.size,
          uploadId,
          userId,
        })
        .catch((err) => this.logger.warn('Operation failed', err));

      if (response?.data) {
        await this.prisma.mediaUpload.update({
          where: { id: upload.id },
          data: { assetId: response.data.assetId },
        });

        return {
          success: true,
          data: {
            uploadId,
            uploadDbId: upload.id,
            uploadUrl: response.data.uploadUrl,
            assetId: response.data.assetId,
          },
        };
      }

      return {
        success: true,
        data: {
          uploadId,
          uploadDbId: upload.id,
        },
      };
    } catch (error) {
      await this.prisma.mediaUpload.update({
        where: { id: upload.id },
        data: { status: 'failed' },
      });
      throw new BadRequestException('Failed to initiate media upload');
    }
  }

  async completeUpload(
    userId: string,
    uploadId: string,
    assetId: string
  ): Promise<CreatorResponse> {
    const upload = await this.prisma.mediaUpload.findFirst({
      where: { uploadId, userId },
    });

    if (!upload) {
      throw new NotFoundException('Upload not found');
    }

    const contentItem = await this.prisma.$transaction(async (tx) => {
      await tx.mediaUpload.update({
        where: { id: upload.id },
        data: { status: 'completed' },
      });

      return await tx.contentItem.create({
        data: {
          title: `Upload ${uploadId}`,
          thumbnail: '',
          mediaUrl: `${this.mediaServiceBaseUrl}/assets/${assetId}`,
          universeId: 'creator',
          creatorId: userId,
          status: 'pending',
          metadata: { uploadId, assetId, uploadDbId: upload.id } as Prisma.InputJsonValue,
        },
      });
    });

    await this.trackAnalyticsEvent('content_uploaded', userId, {
      uploadId,
      assetId,
      contentId: contentItem.id,
    });

    await this.cache.invalidate(`creator:content:${userId}*`);

    return {
      success: true,
      data: {
        contentId: contentItem.id,
        message: 'Upload completed and pending review',
      },
    };
  }

  async getUploadStatus(userId: string, uploadId: string): Promise<CreatorResponse> {
    const upload = await this.prisma.mediaUpload.findFirst({
      where: { uploadId, userId },
    });

    if (!upload) {
      throw new NotFoundException('Upload not found');
    }

    return {
      success: true,
      data: {
        uploadId: upload.uploadId,
        status: upload.status,
        assetId: upload.assetId,
      },
    };
  }

  async getMyProfile(userId: string): Promise<CreatorResponse> {
    const cacheK = cacheKey('creator', `profile:${userId}`);
    const cached = await this.cache.get<CreatorResponse>(cacheK);
    if (cached) return cached;

    const profile = await this.prisma.creatorProfile.findUnique({
      where: { userId },
      include: {
        subscriptions: true,
      },
    });

    if (!profile) {
      throw new NotFoundException(`Creator profile not found`);
    }

    const result: CreatorResponse = {
      success: true,
      data: profile,
    };

    await this.cache.set(cacheK, result, 600);
    return result;
  }

  async getProfile(creatorId: string): Promise<CreatorResponse> {
    const cacheK = cacheKey('creator', `profile:${creatorId}`);
    const cached = await this.cache.get<CreatorResponse>(cacheK);
    if (cached) return cached;

    const profile = await this.prisma.creatorProfile.findUnique({
      where: { userId: creatorId },
      include: {
        subscriptions: {
          where: { status: 'active' },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException(`Creator profile not found`);
    }

    const result: CreatorResponse = {
      success: true,
      data: {
        ...profile,
        subscriberCount: (profile as { subscriptions?: unknown[] }).subscriptions?.length || 0,
        isSubscribed: false,
      } as Record<string, unknown>,
    };

    await this.cache.set(cacheK, result, 600);
    return result;
  }

  async updateProfile(userId: string, profileData: UpdateProfileData): Promise<CreatorResponse> {
    const profile = await this.prisma.creatorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException(`Creator profile not found`);
    }

    const updatedProfile = await this.prisma.creatorProfile.update({
      where: { userId },
      data: {
        ...profileData,
        socialLinks: profileData.socialLinks as unknown as Prisma.InputJsonValue | undefined,
      },
    });

    await this.cache.invalidate(`creator:profile:${userId}*`);

    return {
      success: true,
      data: updatedProfile as Record<string, unknown>,
    };
  }

  async createChannel(userId: string, channelData: ChannelData): Promise<CreatorResponse> {
    const profile = await this.prisma.creatorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Creator profile not found');
    }

    const channel = await this.prisma.channel.create({
      data: {
        creatorId: userId,
        name: channelData.name,
        description: channelData.description,
        category: channelData.category,
      },
    });

    await this.trackAnalyticsEvent('channel_created', userId, {
      channelId: channel.id,
      name: channelData.name,
    });

    return {
      success: true,
      data: {
        channel,
        message: 'Channel created successfully',
      },
    };
  }

  async listChannels(userId: string): Promise<CreatorResponse> {
    const channels = await this.prisma.channel.findMany({
      where: { creatorId: userId },
    });

    return {
      success: true,
      data: { channels } as Record<string, unknown>,
    };
  }

  async getChannel(channelId: string): Promise<CreatorResponse> {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    return {
      success: true,
      data: channel,
    };
  }

  async createUpload(userId: string, uploadData: CreateUploadData): Promise<CreatorResponse> {
    const profile = await this.prisma.creatorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException(`Creator profile not found`);
    }

    const contentItem = await this.prisma.contentItem.create({
      data: {
        title: uploadData.title,
        description: uploadData.description,
        thumbnail: uploadData.thumbnail || '',
        mediaUrl: uploadData.mediaUrl || '',
        universeId: 'creator',
        creatorId: userId,
        status: 'pending',
      },
    });

    await this.cache.invalidate(`creator:content:${userId}*`);

    return {
      success: true,
      data: contentItem as Record<string, unknown>,
    };
  }

  async createUploadForChannel(
    userId: string,
    channelId: string,
    uploadData: CreateUploadData
  ): Promise<CreatorResponse> {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel || channel.creatorId !== userId) {
      throw new NotFoundException('Channel not found');
    }

    const contentItem = await this.prisma.contentItem.create({
      data: {
        title: uploadData.title,
        description: uploadData.description,
        thumbnail: uploadData.thumbnail || '',
        mediaUrl: uploadData.mediaUrl || '',
        universeId: 'creator',
        creatorId: userId,
        status: 'pending',
        metadata: { channelId } as Prisma.InputJsonValue,
      },
    });

    await this.cache.invalidate(`creator:content:${userId}*`);

    return {
      success: true,
      data: contentItem as Record<string, unknown>,
    };
  }

  async listUploads(userId: string): Promise<CreatorResponse> {
    const contentItems = await this.prisma.contentItem.findMany({
      where: { creatorId: userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: contentItems as unknown as Record<string, unknown>,
    };
  }

  async discover(): Promise<CreatorResponse> {
    const creators = await this.prisma.creatorProfile.findMany({
      where: { verified: true },
      include: {
        subscriptions: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return {
      success: true,
      data: creators as unknown as Record<string, unknown>,
    };
  }

  async sendTip(
    userId: string,
    creatorId: string,
    amount: number,
    message?: string
  ): Promise<CreatorResponse> {
    if (amount <= 0) {
      throw new BadRequestException('Tip amount must be greater than 0');
    }

    const creatorProfile = await this.prisma.creatorProfile.findUnique({
      where: { userId: creatorId },
    });

    if (!creatorProfile) {
      throw new NotFoundException(`Creator not found`);
    }

    if (userId === creatorId) {
      throw new BadRequestException('Cannot tip yourself');
    }

    let senderWallet: { id: string; balance: number | string } | undefined;
    try {
      const response = await axios.get<{ data?: { id: string; balance: number | string } }>(
        `${this.walletServiceBaseUrl}/wallets/user/${userId}`
      );
      senderWallet = response.data?.data;
    } catch (error) {
      throw new NotFoundException('Sender wallet not found');
    }
    if (!senderWallet) {
      throw new NotFoundException('Sender wallet not found');
    }

    let creatorWallet: { id: string; balance: number | string } | undefined;
    try {
      const response = await axios.get<{ data?: { id: string; balance: number | string } }>(
        `${this.walletServiceBaseUrl}/wallets/user/${creatorId}`
      );
      creatorWallet = response.data?.data;
    } catch (error) {
      throw new NotFoundException('Creator wallet not found');
    }
    if (!creatorWallet) {
      throw new NotFoundException('Creator wallet not found');
    }

    const idempotencyKey = `tip:${userId}:${creatorId}:${amount}`;

    const existingTip = await this.prisma.tip.findFirst({
      where: {
        fromUserId: userId,
        toUserId: creatorId,
        amount: amount,
        createdAt: { gte: new Date(Date.now() - 60000) },
      },
    });

    if (existingTip) {
      await this.trackAnalyticsEvent('creator_tip_sent', userId, {
        creatorId,
        amount,
        idempotent: true,
        tipId: existingTip.id,
      });

      return {
        success: true,
        data: {
          tipId: existingTip.id,
          amount,
          message: 'Tip already processed (idempotent request)',
        },
      };
    }

    try {
      const debitResult = await axios
        .post(
          `${this.walletServiceBaseUrl}/wallet/debit`,
          {
            walletId: senderWallet.id,
            amount,
            description: `Tip to creator ${creatorId}`,
            idempotencyKey,
          },
          { timeout: 10000 }
        )
        .catch((err) => {
          if (err.response?.data?.idempotent === true) {
            return { data: { existing: true } };
          }
          throw err;
        });

      if (debitResult.data?.existing) {
        const existing = await this.prisma.tip.findFirst({
          where: { fromUserId: userId, toUserId: creatorId },
          orderBy: { createdAt: 'desc' },
        });
        if (existing) {
          await this.trackAnalyticsEvent('creator_tip_sent', userId, {
            creatorId,
            amount,
            idempotent: true,
            tipId: existing.id,
          });

          return {
            success: true,
            data: {
              tipId: existing.id,
              amount,
              message: 'Tip already processed (idempotent request)',
            },
          };
        }
      }

      try {
        await axios.post(
          `${this.walletServiceBaseUrl}/wallet/credit`,
          {
            walletId: creatorWallet.id,
            amount,
            description: `Tip from user ${userId}`,
            idempotencyKey: `${idempotencyKey}:credit`,
          },
          { timeout: 10000 }
        );
      } catch (creditError: unknown) {
        await axios
          .post(
            `${this.walletServiceBaseUrl}/wallet/credit`,
            {
              walletId: senderWallet.id,
              amount,
              description: `Compensation for failed tip credit: ${idempotencyKey}`,
              reference: `compensate:${idempotencyKey}`,
            },
            { timeout: 10000 }
          )
          .catch((compensateError: unknown) => {
            this.logger.error('Failed to compensate sender after credit failure:', compensateError);
          });
        throw creditError;
      }

      const transactionResult = await this.prisma.$transaction(async (tx) => {
        const newTipRecord = await tx.tip.create({
          data: {
            fromUserId: userId,
            toUserId: creatorId,
            creatorId,
            amount,
            message: message || null,
          },
        });

        const earningRecord = await tx.creatorEarning.create({
          data: {
            creatorId,
            amount,
            type: 'tip',
            referenceId: newTipRecord.id,
            status: 'pending',
          },
        });

        const previousEntry = await tx.tipLeaderboard.findUnique({
          where: { creatorId_userId: { creatorId, userId } },
        });
        const previousTotal = previousEntry ? Number(previousEntry.totalAmount) : 0;
        const newTotal = previousTotal + Number(amount);
        const newTier = this.calculateTipTier(newTotal);
        const previousTier = previousEntry?.tier || '';

        await tx.tipLeaderboard.upsert({
          where: { creatorId_userId: { creatorId, userId } },
          update: { totalAmount: { increment: amount }, tier: newTier, lastTipAt: new Date() },
          create: { creatorId, userId, totalAmount: amount, tier: newTier, lastTipAt: new Date() },
        });

        return { newTip: newTipRecord, earning: earningRecord, newTier, previousTier, newTotal };
      });

      const newTip = transactionResult.newTip;

      await this.trackAnalyticsEvent('creator_tip_sent', userId, {
        creatorId,
        amount,
        idempotencyKey,
        tipId: newTip.id,
      });

      await this.trackAnalyticsEvent('tip_received', creatorId, {
        fromUserId: userId,
        amount,
        tipId: newTip.id,
      });

      if (
        transactionResult.newTier &&
        transactionResult.newTier !== transactionResult.previousTier
      ) {
        await this.trackAnalyticsEvent('tier_unlocked', userId, {
          creatorId,
          tier: transactionResult.newTier,
          totalAmount: transactionResult.newTotal,
        });
      }

      await this.cache.invalidate(`creator:earnings:${creatorId}*`);
      await this.cache.invalidate(`creator:leaderboard:${creatorId}*`);

      return {
        success: true,
        data: {
          tipId: newTip.id,
          amount,
          balance: debitResult.data?.balance,
          tier: transactionResult.newTier || null,
          message: 'Tip sent successfully',
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? (error as Error).message : 'Failed to send tip';
      throw new BadRequestException(errorMessage);
    }
  }

  private calculateTipTier(totalAmount: number): string {
    if (totalAmount >= 100000) return 'platinum';
    if (totalAmount >= 50000) return 'gold';
    if (totalAmount >= 10000) return 'silver';
    if (totalAmount >= 1000) return 'bronze';
    return '';
  }

  async getTipLeaderboard(creatorId: string, period: string): Promise<CreatorResponse> {
    const where: Record<string, unknown> = { creatorId };

    if (period === 'weekly') {
      where.lastTipAt = { gte: new Date(Date.now() - 7 * 86400000) };
    } else if (period === 'monthly') {
      where.lastTipAt = { gte: new Date(Date.now() - 30 * 86400000) };
    }

    const entries = await this.prisma.tipLeaderboard.findMany({
      where,
      orderBy: { totalAmount: 'desc' },
      take: 50,
    });

    return { success: true, data: { entries, period } };
  }

  async getTipStats(creatorId: string): Promise<CreatorResponse> {
    const [totalTips, totalAmount, topTier, recentTips] = await Promise.all([
      this.prisma.tip.count({ where: { creatorId } }),
      this.prisma.tip.aggregate({ where: { creatorId }, _sum: { amount: true } }),
      this.prisma.tipLeaderboard.findFirst({
        where: { creatorId },
        orderBy: { totalAmount: 'desc' },
      }),
      this.prisma.tip.findMany({
        where: { creatorId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return {
      success: true,
      data: {
        totalTips,
        totalAmount: totalAmount._sum.amount || 0,
        topTier: topTier?.tier || null,
        recentTips,
      },
    };
  }

  async getMyTips(userId: string): Promise<CreatorResponse> {
    const tips = await this.prisma.tip.findMany({
      where: { fromUserId: userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const totalAmount = tips.reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      success: true,
      data: { tips, totalAmount, count: tips.length },
    };
  }

  async subscribe(
    userId: string,
    creatorId: string,
    tier: string = 'free'
  ): Promise<CreatorResponse> {
    const existingSubscription = await this.prisma.subscription.findUnique({
      where: {
        userId_creatorId: { userId, creatorId },
      },
    });

    if (existingSubscription) {
      if (existingSubscription.status === 'active') {
        throw new BadRequestException('Already subscribed to this creator');
      }
      const renewed = await this.prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: { status: 'active', tier, startDate: new Date() },
      });
      return {
        success: true,
        data: {
          subscriptionId: renewed.id,
          message: 'Subscription renewed successfully',
        },
      };
    }

    const creatorProfile = await this.prisma.creatorProfile.findUnique({
      where: { userId: creatorId },
    });

    if (!creatorProfile) {
      throw new NotFoundException('Creator not found');
    }

    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        creatorId,
        tier,
        status: 'active',
      },
    });

    await this.trackAnalyticsEvent('subscription_created', userId, {
      creatorId,
      tier,
      subscriptionId: subscription.id,
    });

    await this.cache.invalidate(`creator:profile:${creatorId}*`);

    return {
      success: true,
      data: {
        subscriptionId: subscription.id,
        message: 'Subscribed successfully',
      },
    };
  }

  async subscribePremium(
    userId: string,
    creatorId: string,
    tier: string,
    amount: number
  ): Promise<CreatorResponse> {
    if (amount <= 0) {
      throw new BadRequestException('Subscription amount must be greater than 0');
    }

    const existingSubscription = await this.prisma.subscription.findUnique({
      where: {
        userId_creatorId: { userId, creatorId },
      },
    });

    if (existingSubscription?.status === 'active') {
      throw new BadRequestException('Already subscribed to this creator');
    }

    const creatorProfile = await this.prisma.creatorProfile.findUnique({
      where: { userId: creatorId },
    });

    if (!creatorProfile) {
      throw new NotFoundException('Creator not found');
    }

    const senderWalletResponse = await axios
      .get(`${this.walletServiceBaseUrl}/wallets/user/${userId}`, { timeout: 10000 })
      .catch(() => null);
    const senderWallet = senderWalletResponse?.data?.wallet || senderWalletResponse?.data;
    if (!senderWallet) {
      throw new NotFoundException('Wallet not found');
    }

    const creatorWalletResponse = await axios
      .get(`${this.walletServiceBaseUrl}/wallets/user/${creatorId}`, { timeout: 10000 })
      .catch(() => null);
    const creatorWallet = creatorWalletResponse?.data?.wallet || creatorWalletResponse?.data;
    if (!creatorWallet) {
      throw new NotFoundException('Creator wallet not found');
    }

    const idempotencyKey = `subscribe:${userId}:${creatorId}:${tier}`;

    try {
      const debitResult = await axios
        .post(
          `${this.walletServiceBaseUrl}/wallet/debit`,
          {
            walletId: senderWallet.id,
            amount,
            description: `Subscription to creator ${creatorId} - ${tier}`,
            idempotencyKey,
          },
          { timeout: 10000 }
        )
        .catch((err) => {
          if (err.response?.data?.idempotent === true) {
            return { data: { existing: true } };
          }
          throw err;
        });

      if (debitResult.data?.existing) {
        const existing = await this.prisma.subscription.findUnique({
          where: { userId_creatorId: { userId, creatorId } },
        });
        if (existing) {
          return {
            success: true,
            data: {
              subscriptionId: existing.id,
              message: 'Subscription already exists (idempotent request)',
            },
          };
        }
      }

      try {
        await axios.post(
          `${this.walletServiceBaseUrl}/wallet/credit`,
          {
            walletId: creatorWallet.id,
            amount,
            description: `Subscription from user ${userId} - ${tier}`,
            idempotencyKey: `${idempotencyKey}:credit`,
          },
          { timeout: 10000 }
        );
      } catch (creditError: unknown) {
        await axios
          .post(
            `${this.walletServiceBaseUrl}/wallet/credit`,
            {
              walletId: senderWallet.id,
              amount,
              description: `Compensation for failed subscription credit: ${idempotencyKey}`,
              reference: `compensate:${idempotencyKey}`,
            },
            { timeout: 10000 }
          )
          .catch((compensateError: unknown) => {
            this.logger.error(
              'Failed to compensate sender after subscription credit failure:',
              compensateError
            );
          });
        throw creditError;
      }

      const subscriptionTransactionResult = await this.prisma.$transaction(async (tx) => {
        const newSubscriptionRecord = await tx.subscription.create({
          data: {
            userId,
            creatorId,
            tier,
            status: 'active',
          },
        });

        const earningRecord = await tx.creatorEarning.create({
          data: {
            creatorId,
            amount,
            type: 'subscription',
            referenceId: newSubscriptionRecord.id,
            status: 'pending',
          },
        });

        return { newSubscription: newSubscriptionRecord, earning: earningRecord };
      });

      const newSubscription = subscriptionTransactionResult.newSubscription;

      await this.trackAnalyticsEvent('subscription_created', userId, {
        creatorId,
        tier,
        amount,
        subscriptionId: newSubscription.id,
      });

      await this.cache.invalidate(`creator:earnings:${creatorId}*`);

      return {
        success: true,
        data: {
          subscriptionId: newSubscription.id,
          balance: debitResult.data?.balance,
          message: 'Premium subscription created successfully',
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? (error as Error).message : 'Failed to create subscription';
      throw new BadRequestException(errorMessage);
    }
  }

  async cancelSubscription(userId: string, creatorId: string): Promise<CreatorResponse> {
    const subscription = await this.prisma.subscription.findUnique({
      where: {
        userId_creatorId: { userId, creatorId },
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'cancelled', endDate: new Date() },
    });

    await this.trackAnalyticsEvent('subscription_cancelled', userId, {
      creatorId,
      tier: subscription.tier,
    });

    await this.cache.invalidate(`creator:profile:${creatorId}*`);

    return {
      success: true,
      data: { message: 'Subscription cancelled successfully' },
    };
  }

  async getMySubscriptions(userId: string): Promise<CreatorResponse> {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { userId, status: 'active' },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    return {
      success: true,
      data: { subscriptions } as Record<string, unknown>,
    };
  }

  async getMySubscribers(creatorId: string): Promise<CreatorResponse> {
    const subscribers = await this.prisma.subscription.findMany({
      where: { creatorId, status: 'active' },
    });

    return {
      success: true,
      data: { subscribers } as Record<string, unknown>,
    };
  }

  async getEarnings(userId: string): Promise<CreatorResponse> {
    const cacheK = cacheKey('creator', `earnings:${userId}`);
    const cached = await this.cache.get<CreatorResponse>(cacheK);
    if (cached) return cached;

    const profile = await this.prisma.creatorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException(`Creator profile not found`);
    }

    const totalEarnings = await this.prisma.creatorEarning.aggregate({
      where: { creatorId: userId },
      _sum: { amount: true },
    });

    const pendingEarnings = await this.prisma.creatorEarning.aggregate({
      where: { creatorId: userId, status: 'pending' },
      _sum: { amount: true },
    });

    const paidEarnings = await this.prisma.creatorEarning.aggregate({
      where: { creatorId: userId, status: 'paid' },
      _sum: { amount: true },
    });

    const processingEarnings = await this.prisma.creatorEarning.aggregate({
      where: { creatorId: userId, status: 'processing' },
      _sum: { amount: true },
    });

    const monthlyEarnings = await this.prisma.creatorEarning.aggregate({
      where: {
        creatorId: userId,
        createdAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30)),
        },
      },
      _sum: { amount: true },
    });

    const recentEarnings = await this.prisma.creatorEarning.findMany({
      where: { creatorId: userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const tipEarnings = await this.prisma.creatorEarning.aggregate({
      where: { creatorId: userId, type: 'tip' },
      _sum: { amount: true },
    });

    const subscriptionEarnings = await this.prisma.creatorEarning.aggregate({
      where: { creatorId: userId, type: 'subscription' },
      _sum: { amount: true },
    });

    const result: CreatorResponse = {
      success: true,
      data: {
        totalEarnings: totalEarnings._sum.amount?.toNumber() || 0,
        pendingEarnings: pendingEarnings._sum.amount?.toNumber() || 0,
        processingEarnings: processingEarnings._sum.amount?.toNumber() || 0,
        paidEarnings: paidEarnings._sum.amount?.toNumber() || 0,
        monthlyEarnings: monthlyEarnings._sum.amount?.toNumber() || 0,
        tipEarnings: tipEarnings._sum.amount?.toNumber() || 0,
        subscriptionEarnings: subscriptionEarnings._sum.amount?.toNumber() || 0,
        recentEarnings,
      },
    };

    await this.cache.set(cacheK, result, 300);
    return result;
  }

  async requestPayout(userId: string, payoutData: PayoutRequestData): Promise<CreatorResponse> {
    const profile = await this.prisma.creatorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Creator profile not found');
    }

    const availableEarnings = await this.prisma.creatorEarning.aggregate({
      where: { creatorId: userId, status: 'pending' },
      _sum: { amount: true },
    });

    const available = availableEarnings._sum.amount?.toNumber() || 0;

    if (available < payoutData.amount) {
      throw new BadRequestException(`Insufficient earnings. Available: ${available}`);
    }

    if (payoutData.amount < this.minimumPayout) {
      throw new BadRequestException(`Minimum payout amount is ${this.minimumPayout} NGN`);
    }

    const payoutRequest = await this.prisma.$transaction(async (tx) => {
      const request = await tx.payoutRequest.create({
        data: {
          creatorId: userId,
          amount: payoutData.amount,
          method: payoutData.method,
          accountDetails: payoutData.accountDetails as Prisma.InputJsonValue,
          status: 'pending',
        },
      });

      await tx.creatorEarning.updateMany({
        where: { creatorId: userId, status: 'pending' },
        data: { status: 'processing' },
      });

      return request;
    });

    await this.trackAnalyticsEvent('payout_requested', userId, {
      payoutId: payoutRequest.id,
      amount: payoutData.amount,
      method: payoutData.method,
    });

    await this.cache.invalidate(`creator:earnings:${userId}*`);

    return {
      success: true,
      data: {
        payoutId: payoutRequest.id,
        amount: payoutData.amount,
        message: 'Payout request submitted',
      },
    };
  }

  async getPayoutHistory(userId: string): Promise<CreatorResponse> {
    const payouts = await this.prisma.payoutRequest.findMany({
      where: { creatorId: userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: { payouts } as Record<string, unknown>,
    };
  }

  async getAnalytics(userId: string): Promise<CreatorResponse> {
    const profile = await this.prisma.creatorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException(`Creator profile not found`);
    }

    const contentItems = await (
      this.prisma as unknown as {
        contentItem: { findMany: (args: unknown) => Promise<{ viewCount: number }[]> };
      }
    ).contentItem.findMany({
      where: { creatorId: userId },
    });

    const totalViews = contentItems.reduce(
      (sum: number, item: { viewCount: number }) => sum + item.viewCount,
      0
    );

    const totalSubscribers = await this.prisma.subscription.count({
      where: { creatorId: userId, status: 'active' },
    });

    const tipAggregate = await this.prisma.tip.aggregate({
      where: { toUserId: userId },
      _sum: { amount: true },
    });

    const totalEarnings = await this.prisma.creatorEarning.aggregate({
      where: { creatorId: userId },
      _sum: { amount: true },
    });

    const recentUploads = await (
      this.prisma as unknown as {
        contentItem: { findMany: (args: unknown) => Promise<Record<string, unknown>[]> };
      }
    ).contentItem.findMany({
      where: { creatorId: userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const viewsLast7Days = await (
      this.prisma as unknown as { productEvent: { count: (args: unknown) => Promise<number> } }
    ).productEvent.count({
      where: {
        type: 'content_view',
        metadata: { path: ['creatorId'], equals: userId },
        timestamp: {
          gte: new Date(new Date().setDate(new Date().getDate() - 7)),
        },
      },
    });

    const viewsLast30Days = await (
      this.prisma as unknown as { productEvent: { count: (args: unknown) => Promise<number> } }
    ).productEvent.count({
      where: {
        type: 'content_view',
        metadata: { path: ['creatorId'], equals: userId },
        timestamp: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30)),
        },
      },
    });

    const topContent = await (
      this.prisma as unknown as {
        contentItem: { findMany: (args: unknown) => Promise<Record<string, unknown>[]> };
      }
    ).contentItem.findMany({
      where: { creatorId: userId },
      orderBy: { viewCount: 'desc' },
      take: 5,
    });

    const subscriberGrowth = await this.prisma.subscription.groupBy({
      by: ['createdAt'],
      _count: { id: true },
      where: {
        creatorId: userId,
        createdAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30)),
        },
      },
    });

    return {
      success: true,
      data: {
        profile: {
          id: profile.id,
          displayName: profile.displayName || '',
          bio: profile.bio || '',
          avatar: profile.avatar || '',
          subscriberCount: totalSubscribers,
          totalViews,
          createdAt: profile.createdAt,
          verified: profile.verified,
        },
        content: {
          totalUploads: contentItems.length,
          totalViews,
          viewsLast7Days,
          viewsLast30Days,
          topContent,
          recentUploads,
        },
        audience: {
          totalSubscribers,
          subscriberGrowth: subscriberGrowth.length,
        },
        earnings: {
          total: totalEarnings._sum.amount?.toNumber() || 0,
          tips: Number(tipAggregate._sum.amount) || 0,
          pending: 0,
          paid: 0,
          currency: 'NGN',
          totalEarnings: totalEarnings._sum.amount?.toNumber() || 0,
        },
      },
    };
  }

  async createChallenge(userId: string, challengeData: ChallengeData): Promise<CreatorResponse> {
    const profile = await this.prisma.creatorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Creator profile not found');
    }

    const challenge = await this.prisma.creatorChallenge.create({
      data: {
        creatorId: userId,
        title: challengeData.title,
        description: challengeData.description,
        prize: challengeData.prize,
        startDate: challengeData.startDate,
        endDate: challengeData.endDate,
        status: 'active',
      },
    });

    await this.trackAnalyticsEvent('challenge_created', userId, {
      challengeId: challenge.id,
      title: challengeData.title,
    });

    return {
      success: true,
      data: {
        challenge,
        message: 'Challenge created successfully',
      },
    };
  }

  async listChallenges(userId: string): Promise<CreatorResponse> {
    const challenges = await this.prisma.creatorChallenge.findMany({
      where: { creatorId: userId },
      include: {
        _count: {
          select: { entries: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: { challenges } as Record<string, unknown>,
    };
  }

  async getChallenges(creatorId?: string): Promise<CreatorResponse> {
    const where = creatorId ? { creatorId } : {};
    const challenges = await this.prisma.creatorChallenge.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            userId: true,
          },
        },
        _count: {
          select: { entries: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: { challenges } as Record<string, unknown>,
    };
  }

  async getChallenge(challengeId: string): Promise<CreatorResponse> {
    const challenge = await this.prisma.creatorChallenge.findUnique({
      where: { id: challengeId },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
          },
        },
        _count: {
          select: { entries: true },
        },
      },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    return {
      success: true,
      data: challenge,
    };
  }

  async participateInChallenge(
    userId: string,
    challengeId: string,
    contentUrl: string
  ): Promise<CreatorResponse> {
    const challenge = await this.prisma.creatorChallenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    if (challenge.status !== 'active') {
      throw new BadRequestException('Challenge is not active');
    }

    if (new Date() < challenge.startDate) {
      throw new BadRequestException('Challenge has not started yet');
    }

    if (new Date() > challenge.endDate) {
      throw new BadRequestException('Challenge has ended');
    }

    const existingEntry = await this.prisma.challengeEntry.findUnique({
      where: {
        userId_challengeId: { userId, challengeId },
      },
    });

    if (existingEntry) {
      throw new BadRequestException('Already participated in this challenge');
    }

    const entry = await this.prisma.challengeEntry.create({
      data: {
        userId,
        challengeId,
        contentUrl,
      },
    });

    await this.trackAnalyticsEvent('challenge_participated', userId, {
      challengeId,
      entryId: entry.id,
    });

    return {
      success: true,
      data: {
        entryId: entry.id,
        message: 'Successfully participated in challenge',
      },
    };
  }

  async getChallengeLeaderboard(challengeId: string): Promise<CreatorResponse> {
    const challenge = await this.prisma.creatorChallenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    const entries = await this.prisma.challengeEntry.findMany({
      where: { challengeId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: {
        challenge: {
          id: challenge.id,
          title: challenge.title,
          prize: challenge.prize,
          endDate: challenge.endDate,
        },
        entries,
      },
    };
  }

  async getMyChallenges(userId: string): Promise<CreatorResponse> {
    const entries = await this.prisma.challengeEntry.findMany({
      where: { userId },
      include: {
        challenge: {
          include: {
            creator: {
              select: {
                id: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: { challenges: entries } as Record<string, unknown>,
    };
  }

  async getStats(userId: string): Promise<CreatorResponse> {
    const profile = await this.prisma.creatorProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Creator profile not found');

    const [contentCount, earnings, subscribers] = await Promise.all([
      this.prisma.contentItem.count({ where: { creatorId: userId } }),
      this.prisma.creatorEarning.aggregate({
        where: { creatorId: profile.id },
        _sum: { amount: true },
      }),
      this.prisma.subscription.count({ where: { creatorId: profile.id, status: 'active' } }),
    ]);

    // Fetch analytics data from analytics-service
    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let viewsChangePercentage: number | null = null;
    let viewsChange: number | null = null;
    let likesChange: number | null = null;
    let commentsChange: number | null = null;
    let followersChange: number | null = null;

    try {
      const analyticsResponse = await axios.get(
        `${this.analyticsServiceBaseUrl}/analytics/creator/${profile.id}/stats`,
        { timeout: 5000 }
      );
      const analyticsData = analyticsResponse.data?.data || analyticsResponse.data;
      if (analyticsData) {
        totalViews = analyticsData.totalViews || 0;
        totalLikes = analyticsData.totalLikes || 0;
        totalComments = analyticsData.totalComments || 0;
        viewsChangePercentage = analyticsData.viewsChangePercentage ?? null;
        viewsChange = analyticsData.viewsChange ?? null;
        likesChange = analyticsData.likesChange ?? null;
        commentsChange = analyticsData.commentsChange ?? null;
        followersChange = analyticsData.followersChange ?? null;
      }
    } catch (analyticsError) {
      this.logger.warn(
        `Failed to fetch analytics for creator ${profile.id}: ${(analyticsError as Error).message}`
      );
    }

    // Calculate pending earnings (earnings not yet paid out)
    const pendingEarnings = await this.prisma.creatorEarning.aggregate({
      where: { creatorId: profile.id, status: 'pending' },
      _sum: { amount: true },
    });

    // Calculate engagement rate (likes + comments / views)
    const avgEngagementRate =
      totalViews > 0
        ? Math.round(((totalLikes + totalComments) / totalViews) * 100 * 100) / 100
        : 0;

    return {
      success: true,
      data: {
        totalViews,
        totalLikes,
        totalComments,
        followerCount: subscribers,
        contentCount,
        totalEarnings: Number(earnings._sum.amount) || 0,
        pendingEarnings: Number(pendingEarnings._sum.amount) || 0,
        // Change percentages from analytics-service
        viewsChangePercentage,
        avgEngagementRate,
        totalFollowers: subscribers,
        viewsChange,
        likesChange,
        commentsChange,
        followersChange,
      } as Record<string, unknown>,
    };
  }

  async getSettings(userId: string): Promise<CreatorResponse> {
    const profile = await this.prisma.creatorProfile.findUnique({
      where: { userId },
      select: { settings: true },
    });

    const defaultSettings = {
      notifications: {
        email: true,
        push: true,
        sms: false,
        marketing: false,
      },
      privacy: {
        profileVisibility: 'public',
        showEarnings: false,
        allowMessages: true,
      },
    };

    if (!profile?.settings) {
      return { success: true, data: defaultSettings };
    }

    const raw = profile.settings as Record<string, unknown>;
    const notifications = (raw.notifications as Record<string, unknown>) || {
      email: raw.emailNotifications ?? true,
      push: raw.pushNotifications ?? true,
      sms: raw.smsNotifications ?? false,
      marketing: raw.marketingNotifications ?? false,
    };
    const privacy = (raw.privacy as Record<string, unknown>) || {
      profileVisibility: (raw.profileVisibility as string) || 'public',
      showEarnings: (raw.showEarnings as boolean) ?? false,
      allowMessages: (raw.allowMessages as boolean) ?? true,
    };

    return {
      success: true,
      data: { notifications, privacy },
    };
  }

  async updateSettings(
    userId: string,
    data: {
      notifications?:
        | Record<string, boolean>
        | { email?: boolean; push?: boolean; sms?: boolean; marketing?: boolean };
      privacy?: Record<string, unknown> | { profileVisibility?: string; showEarnings?: boolean };
    }
  ): Promise<CreatorResponse> {
    const profile = await this.prisma.creatorProfile.findUnique({
      where: { userId },
      select: { id: true, settings: true },
    });

    if (!profile) {
      throw new NotFoundException('Creator profile not found');
    }

    const current = (profile.settings as Record<string, unknown>) || {};
    const currentNotifications = (current.notifications as Record<string, boolean>) || {
      email: (current.emailNotifications as boolean) ?? true,
      push: (current.pushNotifications as boolean) ?? true,
      sms: (current.smsNotifications as boolean) ?? false,
      marketing: (current.marketingNotifications as boolean) ?? false,
    };
    const currentPrivacy = (current.privacy as Record<string, unknown>) || {
      profileVisibility: (current.profileVisibility as string) || 'public',
      showEarnings: (current.showEarnings as boolean) ?? false,
      allowMessages: (current.allowMessages as boolean) ?? true,
    };

    const updatedSettings = {
      notifications: { ...currentNotifications, ...data.notifications },
      privacy: { ...currentPrivacy, ...data.privacy },
    };

    await this.prisma.creatorProfile.update({
      where: { id: profile.id },
      data: { settings: updatedSettings as Prisma.InputJsonValue },
    });

    await this.cache.invalidate(`creator:profile:${userId}*`);

    return {
      success: true,
      data: updatedSettings,
    };
  }

  async getCreatorContent(creatorId: string, page = 1, limit = 20): Promise<CreatorResponse> {
    const cacheK = cacheKey('creator', `content:${creatorId}:${page}:${limit}`);
    const cached = await this.cache.get<CreatorResponse>(cacheK);
    if (cached) return cached;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.contentItem.findMany({
        where: { creatorId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contentItem.count({ where: { creatorId } }),
    ]);

    const result: CreatorResponse = {
      success: true,
      data: {
        items,
        total,
        page,
        limit,
        hasMore: skip + limit < total,
      } as Record<string, unknown>,
    };

    await this.cache.set(cacheK, result, 300);
    return result;
  }
}
