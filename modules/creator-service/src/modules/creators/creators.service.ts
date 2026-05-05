import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreatorResponse } from './interfaces/creator-response.interface';

interface UpdateProfileData {
  displayName?: string;
  bio?: string;
  avatar?: string;
}

interface CreateUploadData {
  title: string;
  description?: string;
  thumbnail?: string;
  mediaUrl?: string;
}

@Injectable()
export class CreatorsService {
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

    return {
      success: true,
      data: profile as unknown as Record<string, unknown>,
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
        updatedAt: new Date(),
      },
      include: { user: true },
    });

    return {
      success: true,
      data: updatedProfile as unknown as Record<string, unknown>,
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
        user: true,
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
  }

  async subscribe(userId: string, creatorId: string): Promise<CreatorResponse> {
    const existingSubscription = await this.prisma.subscription.findUnique({
      where: {
        userId_creatorId: { userId, creatorId },
      },
    });

    if (existingSubscription) {
      throw new BadRequestException('Already subscribed to this creator');
    }

    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        creatorId,
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
      take: 10,
    });

    return {
      success: true,
      data: {
        totalEarnings: totalEarnings._sum.amount || 0,
        monthlyEarnings: monthlyEarnings._sum.amount || 0,
        recentEarnings,
      },
    };
  }

  async getAnalytics(userId: string): Promise<CreatorResponse> {
    const profile = await this.prisma.creatorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException(`Creator profile not found`);
    }

    const totalViews = await this.prisma.contentItem.aggregate({
      where: { creatorId: userId },
      _sum: { viewCount: true },
    });

    const totalSubscribers = await this.prisma.subscription.count({
      where: { creatorId: userId },
    });

    const recentUploads = await this.prisma.contentItem.findMany({
      where: { creatorId: userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      success: true,
      data: {
        totalViews: totalViews._sum.viewCount || 0,
        totalSubscribers,
        recentUploads,
      },
    };
  }
}
