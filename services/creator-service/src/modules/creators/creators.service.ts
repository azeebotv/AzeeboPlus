import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreatorResponse } from './interfaces/creator-response.interface';
import axios from 'axios';
import { randomUUID } from 'crypto';

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
  private readonly walletServiceBaseUrl = process.env.WALLET_SERVICE_URL || 'http://localhost:3006';
  private readonly mediaServiceBaseUrl = process.env.MEDIA_SERVICE_URL || 'http://localhost:3007';

  constructor(private readonly prisma: PrismaService) {}

  async onboard(userId: string): Promise<CreatorResponse> {
    const existingProfile = await this.prisma.creatorProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      throw new BadRequestException('Creator profile already exists');
    }

    const profile = await this.prisma.creatorProfile.create({
      data: {
        userId,
        bio: '',
        verified: false,
      },
      include: { user: true },
    });

    await this.prisma.notification.create({
      data: {
        userId,
        type: 'system',
        title: 'Welcome to Creator Program',
        message:
          'Your creator profile has been created. Complete verification to unlock all features.',
      },
    });

    return {
      success: true,
      data: profile as unknown as Record<string, unknown>,
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

    await this.prisma.notification.create({
      data: {
        userId,
        type: 'system',
        title: 'Verification Submitted',
        message: 'Your verification documents have been submitted for review.',
        metadata: { documents } as unknown as Record<string, unknown>,
      },
    });

    return {
      success: true,
      data: {
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

    return {
      success: true,
      data: {
        verified: profile.verified,
        message: profile.verified ? 'Creator is verified' : 'Verification pending or not submitted',
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

    try {
      const response = await axios.post(`${this.mediaServiceBaseUrl}/upload/presigned`, {
        fileName: data.fileName,
        mimeType: data.mimeType,
        size: data.size,
        uploadId,
      });

      return {
        success: true,
        data: {
          uploadId,
          uploadUrl: response.data.uploadUrl,
          assetId: response.data.assetId,
        },
      };
    } catch (error: unknown) {
      throw new BadRequestException('Failed to initiate media upload');
    }
  }

  async completeUpload(
    userId: string,
    uploadId: string,
    assetId: string
  ): Promise<CreatorResponse> {
    const contentItem = await this.prisma.contentItem.create({
      data: {
        title: `Upload ${uploadId}`,
        thumbnail: '',
        mediaUrl: `${this.mediaServiceBaseUrl}/assets/${assetId}`,
        universeId: 'creator',
        creatorId: userId,
        status: 'pending',
        metadata: { uploadId, assetId } as unknown as Record<string, unknown>,
      },
    });

    return {
      success: true,
      data: {
        contentId: contentItem.id,
        message: 'Upload completed and pending review',
      },
    };
  }

  async getMyProfile(userId: string): Promise<CreatorResponse> {
    const profile = await this.prisma.creatorProfile.findUnique({
      where: { userId },
      include: {
        user: true,
        contentItems: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            contentItems: true,
            subscribers: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException(`Creator profile not found`);
    }

    return {
      success: true,
      data: profile as unknown as Record<string, unknown>,
    };
  }

  async getProfile(creatorId: string): Promise<CreatorResponse> {
    const profile = await this.prisma.creatorProfile.findUnique({
      where: { userId: creatorId },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
          },
        },
        contentItems: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            contentItems: true,
            subscribers: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException(`Creator profile not found`);
    }

    return {
      success: true,
      data: profile as unknown as Record<string, unknown>,
    };
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
        socialLinks: profileData.socialLinks as unknown as Record<string, string> | undefined,
        updatedAt: new Date(),
      },
      include: { user: true },
    });

    return {
      success: true,
      data: updatedProfile as unknown as Record<string, unknown>,
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
      include: {
        _count: {
          select: { contentItems: true },
        },
      },
    });

    return {
      success: true,
      data: channels,
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
        contentItems: {
          orderBy: { createdAt: 'desc' },
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
        mediaUrl: uploadData.mediaUrl,
        universeId: 'creator',
        creatorId: userId,
        status: 'pending',
      },
      include: { creator: true, universe: true },
    });

    return {
      success: true,
      data: contentItem as unknown as Record<string, unknown>,
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
        mediaUrl: uploadData.mediaUrl,
        universeId: 'creator',
        creatorId: userId,
        status: 'pending',
        metadata: { channelId } as unknown as Record<string, unknown>,
      },
    });

    return {
      success: true,
      data: contentItem as unknown as Record<string, unknown>,
    };
  }

  async listUploads(userId: string): Promise<CreatorResponse> {
    const contentItems = await this.prisma.contentItem.findMany({
      where: { creatorId: userId },
      orderBy: { createdAt: 'desc' },
      include: { universe: true },
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
        user: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            contentItems: true,
            subscribers: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return {
      success: true,
      data: creators as unknown as Record<string, unknown>,
    };
  }

  async sendTip(userId: string, creatorId: string, amount: number): Promise<CreatorResponse> {
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

    const senderWallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!senderWallet) {
      throw new NotFoundException(`Sender wallet not found`);
    }

    const creatorWallet = await this.prisma.wallet.findUnique({ where: { userId: creatorId } });
    if (!creatorWallet) {
      throw new NotFoundException(`Creator wallet not found`);
    }

    const idempotencyKey = randomUUID();

    try {
      await axios.post(`${this.walletServiceBaseUrl}/wallet/debit`, {
        walletId: senderWallet.id,
        amount,
        description: `Tip to creator ${creatorId}`,
        idempotencyKey,
      });

      await axios.post(`${this.walletServiceBaseUrl}/wallet/credit`, {
        walletId: creatorWallet.id,
        amount,
        description: `Tip from user ${userId}`,
        idempotencyKey,
      });

      const tip = await this.prisma.tip.create({
        data: {
          fromUserId: userId,
          toUserId: creatorId,
          amount,
        },
      });

      await this.prisma.creatorEarning.create({
        data: {
          creatorId,
          amount,
          type: 'tip',
          referenceId: tip.id,
        },
      });

      return {
        success: true,
        data: {
          tipId: tip.id,
          amount,
          message: 'Tip sent successfully',
        },
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send tip';
      throw new BadRequestException(errorMessage);
    }
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
      throw new BadRequestException('Already subscribed to this creator');
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

    return {
      success: true,
      data: {
        subscriptionId: subscription.id,
        message: 'Subscribed successfully',
      },
    };
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
      data: { status: 'cancelled' },
    });

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
      data: subscriptions,
    };
  }

  async getMySubscribers(creatorId: string): Promise<CreatorResponse> {
    const subscribers = await this.prisma.subscription.findMany({
      where: { creatorId, status: 'active' },
      include: {
        user: {
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
      data: subscribers,
    };
  }

  async getEarnings(userId: string): Promise<CreatorResponse> {
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

    return {
      success: true,
      data: {
        totalEarnings: totalEarnings._sum.amount?.toNumber() || 0,
        pendingEarnings: pendingEarnings._sum.amount?.toNumber() || 0,
        paidEarnings: paidEarnings._sum.amount?.toNumber() || 0,
        monthlyEarnings: monthlyEarnings._sum.amount?.toNumber() || 0,
        tipEarnings: tipEarnings._sum.amount?.toNumber() || 0,
        subscriptionEarnings: subscriptionEarnings._sum.amount?.toNumber() || 0,
        recentEarnings,
      },
    };
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

    const payoutRequest = await this.prisma.payoutRequest.create({
      data: {
        creatorId: userId,
        amount: payoutData.amount,
        method: payoutData.method,
        accountDetails: payoutData.accountDetails as unknown as Record<string, unknown>,
        status: 'pending',
      },
    });

    await this.prisma.creatorEarning.updateMany({
      where: { creatorId: userId, status: 'pending' },
      data: { status: 'processing' },
    });

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
      data: payouts,
    };
  }

  async getAnalytics(userId: string): Promise<CreatorResponse> {
    const profile = await this.prisma.creatorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException(`Creator profile not found`);
    }

    const contentItems = await this.prisma.contentItem.findMany({
      where: { creatorId: userId },
    });

    const totalViews = contentItems.reduce((sum, item) => sum + item.viewCount, 0);

    const totalSubscribers = await this.prisma.subscription.count({
      where: { creatorId: userId, status: 'active' },
    });

    const totalTips = await this.prisma.tip.aggregate({
      where: { toUserId: userId },
      _sum: { amount: true },
    });

    const recentUploads = await this.prisma.contentItem.findMany({
      where: { creatorId: userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const viewsLast7Days = await this.prisma.productEvent.count({
      where: {
        type: 'content_view',
        metadata: { path: ['creatorId'], equals: userId },
        timestamp: {
          gte: new Date(new Date().setDate(new Date().getDate() - 7)),
        },
      },
    });

    const viewsLast30Days = await this.prisma.productEvent.count({
      where: {
        type: 'content_view',
        metadata: { path: ['creatorId'], equals: userId },
        timestamp: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30)),
        },
      },
    });

    const demographics = await this.prisma.productEvent.groupBy({
      by: ['metadata'],
      where: {
        type: 'content_view',
        metadata: { path: ['creatorId'], equals: userId },
      },
      _count: true,
    });

    return {
      success: true,
      data: {
        totalViews,
        totalSubscribers,
        totalTips: totalTips._sum.amount?.toNumber() || 0,
        totalContent: contentItems.length,
        recentUploads,
        viewsLast7Days,
        viewsLast30Days,
        demographics,
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

    return {
      success: true,
      data: {
        challenge,
        message: 'Challenge created successfully',
      },
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
            displayName: true,
            avatar: true,
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
      data: challenges,
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

    const now = new Date();
    if (now < challenge.startDate || now > challenge.endDate) {
      throw new BadRequestException('Challenge is not within valid dates');
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

    return {
      success: true,
      data: {
        entryId: entry.id,
        message: 'Successfully entered challenge',
      },
    };
  }
}
