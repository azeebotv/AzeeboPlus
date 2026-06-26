import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateUniverseAffinityDto } from './dto/update-universe-affinity.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { CompleteProfileSetupDto } from './dto/complete-profile-setup.dto';
import { Prisma } from '@prisma/client';

interface UniverseAffinityResponse {
  userId: string;
  interests: string[];
  universeAffinity: Record<string, number>;
  topUniverses: string[];
}

interface MessageResponse {
  message: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getPreferences(userId: string): Promise<Record<string, unknown>> {
    const prefs = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });

    if (!prefs) {
      return {
        darkMode: false,
        notifications: {},
        contentPreferences: [],
      };
    }

    return {
      darkMode: prefs.darkMode,
      notifications: (prefs.notifications as Record<string, unknown>) || {},
      contentPreferences: (prefs.contentPreferences as string[]) || [],
    };
  }

  async updatePreferences(
    userId: string,
    preferences: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const existing = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });

    const darkMode = preferences.darkMode as boolean | undefined;
    const notifications = preferences.notifications as Prisma.InputJsonValue | undefined;
    const contentPreferences = preferences.contentPreferences as Prisma.InputJsonValue | undefined;

    let result;

    if (existing) {
      const updateData: Prisma.UserPreferencesUpdateInput = {};
      if (darkMode !== undefined) updateData.darkMode = darkMode;
      if (notifications !== undefined) updateData.notifications = notifications;
      if (contentPreferences !== undefined) updateData.contentPreferences = contentPreferences;

      result = await this.prisma.userPreferences.update({
        where: { userId },
        data: updateData,
      });
    } else {
      result = await this.prisma.userPreferences.create({
        data: {
          userId,
          darkMode: darkMode || false,
          notifications: notifications || {},
          contentPreferences: contentPreferences || [],
        },
      });
    }

    return {
      darkMode: result.darkMode,
      notifications: (result.notifications as Record<string, unknown>) || {},
      contentPreferences: (result.contentPreferences as string[]) || [],
    };
  }

  async getPrivacySettings(userId: string): Promise<Record<string, unknown>> {
    const prefs = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });

    const defaults = {
      isPrivate: false,
      showActivity: true,
      allowMessages: true,
      twoFactorEnabled: false,
    };

    if (!prefs || !prefs.privacySettings) {
      return defaults;
    }

    return { ...defaults, ...(prefs.privacySettings as Record<string, unknown>) };
  }

  async updatePrivacySettings(
    userId: string,
    settings: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const existing = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });

    const privacyData = {
      isPrivate: (settings.isPrivate as boolean) ?? false,
      showActivity: (settings.showActivity as boolean) ?? true,
      allowMessages: (settings.allowMessages as boolean) ?? true,
      twoFactorEnabled: (settings.twoFactorEnabled as boolean) ?? false,
    };

    if (existing) {
      await this.prisma.userPreferences.update({
        where: { userId },
        data: { privacySettings: privacyData as Prisma.InputJsonValue },
      });
    } else {
      await this.prisma.userPreferences.create({
        data: {
          userId,
          privacySettings: privacyData as Prisma.InputJsonValue,
        },
      });
    }

    return privacyData;
  }

  async getWatchHistory(userId: string, page = 1, limit = 20): Promise<Record<string, unknown>> {
    const skip = (page - 1) * limit;
    const take = Math.min(limit, 100);

    const [history, total] = await Promise.all([
      this.prisma.watchHistory.findMany({
        where: { userId },
        orderBy: { watchedAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.watchHistory.count({
        where: { userId },
      }),
    ]);

    const totalPages = Math.ceil(total / take);

    return {
      success: true,
      data: history,
      pagination: {
        total,
        page,
        limit: take,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async getSavedItems(userId: string, page = 1, limit = 20): Promise<Record<string, unknown>> {
    const skip = (page - 1) * limit;
    const take = Math.min(limit, 100);

    const [savedItems, total] = await Promise.all([
      this.prisma.savedItem.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.savedItem.count({
        where: { userId },
      }),
    ]);

    const totalPages = Math.ceil(total / take);

    return {
      success: true,
      data: savedItems,
      pagination: {
        total,
        page,
        limit: take,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async saveItem(userId: string, contentId: string): Promise<MessageResponse> {
    const existing = await this.prisma.savedItem.findUnique({
      where: { userId_contentId: { userId, contentId } },
    });

    if (existing) {
      return { message: 'Item already saved' };
    }

    await this.prisma.savedItem.create({
      data: { userId, contentId },
    });

    return { message: 'Item saved successfully' };
  }

  async unsaveItem(userId: string, contentId: string): Promise<MessageResponse> {
    const existing = await this.prisma.savedItem.findUnique({
      where: { userId_contentId: { userId, contentId } },
    });

    if (!existing) {
      throw new NotFoundException('Item not saved');
    }

    await this.prisma.savedItem.delete({
      where: { userId_contentId: { userId, contentId } },
    });

    return { message: 'Item unsaved' };
  }

  async getUniverseAffinity(userId: string): Promise<UniverseAffinityResponse> {
    const history = await this.prisma.watchHistory.findMany({
      where: { userId },
      select: { universe: true },
    });

    const universeCounts: Record<string, number> = {};
    history.forEach((item) => {
      const universe = item.universe || 'unknown';
      universeCounts[universe] = (universeCounts[universe] || 0) + 1;
    });

    const prefs = await this.getPreferences(userId);

    return {
      userId,
      interests: prefs.contentPreferences as string[],
      universeAffinity: universeCounts,
      topUniverses: Object.entries(universeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([universe]) => universe),
    };
  }

  async updateUniverseAffinity(
    userId: string,
    dto: UpdateUniverseAffinityDto
  ): Promise<{ message: string; interests: string[] }> {
    const interests = dto.interests || [];

    await this.updatePreferences(userId, {
      contentPreferences: interests,
    });

    return {
      message: 'Universe affinity updated',
      interests,
    };
  }

  async getProfile(userId: string): Promise<Record<string, unknown>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User not found`);
    }

    return {
      success: true,
      data: user,
    };
  }

  async updateProfile(userId: string, dto: UpdateUserProfileDto): Promise<Record<string, unknown>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User not found`);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.displayName && { displayName: dto.displayName }),
        ...(dto.avatar && { avatar: dto.avatar }),
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      data: updatedUser,
    };
  }

  async getUserById(userId: string): Promise<Record<string, unknown>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        displayName: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User not found`);
    }

    return {
      success: true,
      data: user,
    };
  }

  async followUser(followerId: string, followingId: string): Promise<Record<string, unknown>> {
    if (followerId === followingId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    const userToFollow = await this.prisma.user.findUnique({
      where: { id: followingId },
    });

    if (!userToFollow) {
      throw new NotFoundException(`User not found`);
    }

    const existingFollow = await this.prisma.following.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      return {
        success: true,
        data: { message: 'Already following this user' },
      };
    }

    await this.prisma.following.create({
      data: {
        followerId,
        followingId,
      },
    });

    return {
      success: true,
      data: { message: 'User followed successfully' },
    };
  }

  async unfollowUser(followerId: string, followingId: string): Promise<Record<string, unknown>> {
    const existingFollow = await this.prisma.following.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (!existingFollow) {
      return {
        success: true,
        data: { message: 'Not following this user' },
      };
    }

    await this.prisma.following.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return {
      success: true,
      data: { message: 'User unfollowed successfully' },
    };
  }

  async getFollowers(
    userId: string,
    page: number,
    limit: number
  ): Promise<Record<string, unknown>> {
    const skip = (page - 1) * limit;

    const [followingRecords, total] = await this.prisma.$transaction([
      this.prisma.following.findMany({
        where: { followingId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.following.count({
        where: { followingId: userId },
      }),
    ]);

    const followerIds = followingRecords.map((f) => f.followerId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: followerIds } },
      select: { id: true, displayName: true, avatar: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return {
      success: true,
      data: {
        followers: followingRecords.map((f) => userMap.get(f.followerId)).filter(Boolean),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async getFollowing(
    userId: string,
    page: number,
    limit: number
  ): Promise<Record<string, unknown>> {
    const skip = (page - 1) * limit;

    const [followingRecords, total] = await this.prisma.$transaction([
      this.prisma.following.findMany({
        where: { followerId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.following.count({
        where: { followerId: userId },
      }),
    ]);

    const followingIds = followingRecords.map((f) => f.followingId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: followingIds } },
      select: { id: true, displayName: true, avatar: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return {
      success: true,
      data: {
        following: followingRecords.map((f) => userMap.get(f.followingId)).filter(Boolean),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async completeProfileSetup(
    userId: string,
    dto: CompleteProfileSetupDto,
    email?: string
  ): Promise<Record<string, unknown>> {
    let user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user && email) {
      user = await this.prisma.user.create({
        data: {
          id: userId,
          email,
          displayName: dto.displayName || email.split('@')[0],
          role: dto.role || 'user',
        },
      });
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.displayName && { displayName: dto.displayName }),
        ...(dto.avatar && { avatar: dto.avatar }),
        ...(dto.role && { role: dto.role }),
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (dto.interests && dto.interests.length > 0) {
      await this.updatePreferences(userId, {
        contentPreferences: dto.interests,
      });
    }

    return {
      success: true,
      data: updatedUser,
    };
  }

  async scheduleDataDeletion(userId: string, reason?: string) {
    return { userId, reason, scheduledAt: new Date(), status: 'scheduled' };
  }

  async deleteUserData(userId: string) {
    return { userId, deletedAt: new Date(), status: 'deleted' };
  }

  async exportUserData(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return { userId, exportedAt: new Date(), data: user };
  }

  async getDeletionStatus(userId: string) {
    return { userId, status: 'none', requestedAt: null };
  }

  async getContinueWatching(userId: string, limit = 10): Promise<Record<string, unknown>> {
    const history = await this.prisma.watchHistory.findMany({
      where: { userId },
      orderBy: { watchedAt: 'desc' },
      take: Math.min(limit, 50),
    });

    return {
      success: true,
      data: history.map((item) => ({
        id: item.contentId,
        contentId: item.contentId,
        contentType: item.contentType,
        universe: item.universe,
        watchedAt: item.watchedAt.toISOString(),
        progress: 0,
      })),
    };
  }

  async getUniverseEngagement(userId: string): Promise<Record<string, unknown>> {
    const affinity = await this.prisma.userUniverseAffinity.findMany({
      where: { userId },
      orderBy: { affinityScore: 'desc' },
    });

    return {
      success: true,
      data: affinity.map((item) => ({
        universeId: item.universeId,
        universeName: item.universeId,
        universeIcon: undefined,
        engagementCount: item.affinityScore,
        lastEngagedAt: item.lastEngaged.toISOString(),
      })),
    };
  }
}
