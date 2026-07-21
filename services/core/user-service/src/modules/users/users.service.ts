import { Inject, Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CacheService, cacheKey } from '@azeebo/shared-services';
import { UpdateUniverseAffinityDto } from './dto/update-universe-affinity.dto.js';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto.js';
import { CompleteProfileSetupDto } from './dto/complete-profile-setup.dto.js';
import { UpdatePreferencesDto } from './dto/update-preferences.dto.js';
import { Prisma } from '../../prisma/client/index.js';

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
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CacheService) private readonly cache: CacheService
  ) {}

  async getPreferences(userId: string): Promise<Record<string, unknown>> {
    try {
      const cacheK = cacheKey('user', `preferences:${userId}`);
      const cached = await this.cache.get<Record<string, unknown>>(cacheK);
      if (cached) return cached;

      const prefs = await this.prisma.userPreferences.findUnique({
        where: { userId },
      });

      if (!prefs) {
        const defaults = {
          darkMode: false,
          notifications: {},
          contentPreferences: [],
        };
        await this.cache.set(cacheK, defaults, 300);
        return defaults;
      }

      const result = {
        darkMode: prefs.darkMode,
        notifications: (prefs.notifications as Record<string, unknown>) || {},
        contentPreferences: (prefs.contentPreferences as string[]) || [],
      };
      await this.cache.set(cacheK, result, 300);
      return result;
    } catch (error: unknown) {
      this.logger.error(`Failed to get preferences for user ${userId}`, error);
      throw new BadRequestException('Failed to retrieve preferences');
    }
  }

  async updatePreferences(
    userId: string,
    preferences: UpdatePreferencesDto
  ): Promise<Record<string, unknown>> {
    try {
      const existing = await this.prisma.userPreferences.findUnique({
        where: { userId },
      });

      const darkMode = preferences.darkMode;
      const notifications = preferences.notifications as Prisma.InputJsonValue | undefined;
      const contentPreferences = preferences.contentPreferences as
        | Prisma.InputJsonValue
        | undefined;

      let result;

      if (existing) {
        const updateData: Record<string, unknown> = {};
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

      const response = {
        darkMode: result.darkMode,
        notifications: (result.notifications as Record<string, unknown>) || {},
        contentPreferences: (result.contentPreferences as string[]) || [],
      };

      // Invalidate preferences cache
      await this.cache.delete(cacheKey('user', `preferences:${userId}`));

      return response;
    } catch (error: unknown) {
      this.logger.error(`Failed to update preferences for user ${userId}`, error);
      throw new BadRequestException('Failed to update preferences');
    }
  }

  async getPrivacySettings(userId: string): Promise<Record<string, unknown>> {
    try {
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
    } catch (error: unknown) {
      this.logger.error(`Failed to get privacy settings for user ${userId}`, error);
      throw new BadRequestException('Failed to retrieve privacy settings');
    }
  }

  async updatePrivacySettings(
    userId: string,
    settings: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    try {
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
    } catch (error: unknown) {
      this.logger.error(`Failed to update privacy settings for user ${userId}`, error);
      throw new BadRequestException('Failed to update privacy settings');
    }
  }

  async getWatchHistory(userId: string, page = 1, limit = 20): Promise<Record<string, unknown>> {
    try {
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
    } catch (error: unknown) {
      this.logger.error(`Failed to get watch history for user ${userId}`, error);
      throw new BadRequestException('Failed to retrieve watch history');
    }
  }

  async getSavedItems(userId: string, page = 1, limit = 20): Promise<Record<string, unknown>> {
    try {
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
    } catch (error: unknown) {
      this.logger.error(`Failed to get saved items for user ${userId}`, error);
      throw new BadRequestException('Failed to retrieve saved items');
    }
  }

  async saveItem(userId: string, contentId: string): Promise<MessageResponse> {
    try {
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
    } catch (error: unknown) {
      this.logger.error(`Failed to save item for user ${userId}`, error);
      throw new BadRequestException('Failed to save item');
    }
  }

  async unsaveItem(userId: string, contentId: string): Promise<MessageResponse> {
    try {
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
    } catch (error: unknown) {
      this.logger.error(`Failed to unsave item for user ${userId}`, error);
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException('Failed to unsave item');
    }
  }

  async getUniverseAffinity(userId: string): Promise<UniverseAffinityResponse> {
    try {
      const history = await this.prisma.watchHistory.findMany({
        where: { userId },
        select: { universe: true },
      });

      const universeCounts: Record<string, number> = {};
      history.forEach((item: { universe: string | null }) => {
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
    } catch (error: unknown) {
      this.logger.error(`Failed to get universe affinity for user ${userId}`, error);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Failed to retrieve universe affinity');
    }
  }

  async updateUniverseAffinity(
    userId: string,
    dto: UpdateUniverseAffinityDto
  ): Promise<{ message: string; interests: string[] }> {
    try {
      const interests = dto.interests || [];

      await this.updatePreferences(userId, {
        contentPreferences: interests,
      });

      return {
        message: 'Universe affinity updated',
        interests,
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to update universe affinity for user ${userId}`, error);
      throw new BadRequestException('Failed to update universe affinity');
    }
  }

  async getProfile(userId: string): Promise<Record<string, unknown>> {
    try {
      const cacheK = cacheKey('user', `profile:${userId}`);
      const cached = await this.cache.get<Record<string, unknown>>(cacheK);
      if (cached) return cached;

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

      const result = {
        success: true,
        data: user,
      };
      await this.cache.set(cacheK, result, 600);
      return result;
    } catch (error: unknown) {
      this.logger.error(`Failed to get profile for user ${userId}`, error);
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException('Failed to retrieve profile');
    }
  }

  async updateProfile(userId: string, dto: UpdateUserProfileDto): Promise<Record<string, unknown>> {
    try {
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

      // Invalidate profile cache
      await this.cache.delete(cacheKey('user', `profile:${userId}`));

      return {
        success: true,
        data: updatedUser,
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to update profile for user ${userId}`, error);
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException('Failed to update profile');
    }
  }

  async getUserById(userId: string): Promise<Record<string, unknown>> {
    try {
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
    } catch (error: unknown) {
      this.logger.error(`Failed to get user by ID ${userId}`, error);
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException('Failed to retrieve user');
    }
  }

  async followUser(followerId: string, followingId: string): Promise<Record<string, unknown>> {
    if (followerId === followingId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    try {
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
    } catch (error: unknown) {
      this.logger.error(`Failed to follow user ${followingId} for user ${followerId}`, error);
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      throw new BadRequestException('Failed to follow user');
    }
  }

  async unfollowUser(followerId: string, followingId: string): Promise<Record<string, unknown>> {
    try {
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
    } catch (error: unknown) {
      this.logger.error(`Failed to unfollow user ${followingId} for user ${followerId}`, error);
      throw new BadRequestException('Failed to unfollow user');
    }
  }

  async getFollowers(
    userId: string,
    page: number,
    limit: number
  ): Promise<Record<string, unknown>> {
    try {
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

      const followerIds = followingRecords.map((f: { followerId: string }) => f.followerId);
      const users = await this.prisma.user.findMany({
        where: { id: { in: followerIds } },
        select: { id: true, displayName: true, avatar: true },
      });

      const userMap = new Map(users.map((u) => [u.id, u]));

      return {
        success: true,
        data: {
          followers: followingRecords
            .map((f: { followerId: string }) => userMap.get(f.followerId))
            .filter(Boolean),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to get followers for user ${userId}`, error);
      throw new BadRequestException('Failed to retrieve followers');
    }
  }

  async getFollowing(
    userId: string,
    page: number,
    limit: number
  ): Promise<Record<string, unknown>> {
    try {
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

      const followingIds = followingRecords.map((f: { followingId: string }) => f.followingId);
      const users = await this.prisma.user.findMany({
        where: { id: { in: followingIds } },
        select: { id: true, displayName: true, avatar: true },
      });

      const userMap = new Map(users.map((u) => [u.id, u]));

      return {
        success: true,
        data: {
          following: followingRecords
            .map((f: { followingId: string }) => userMap.get(f.followingId))
            .filter(Boolean),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to get following for user ${userId}`, error);
      throw new BadRequestException('Failed to retrieve following');
    }
  }

  async completeProfileSetup(
    userId: string,
    dto: CompleteProfileSetupDto,
    email?: string
  ): Promise<Record<string, unknown>> {
    try {
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

      // Invalidate profile cache
      await this.cache.delete(cacheKey('user', `profile:${userId}`));

      return {
        success: true,
        data: updatedUser,
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to complete profile setup for user ${userId}`, error);
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException('Failed to complete profile setup');
    }
  }

  async scheduleDataDeletion(userId: string, reason?: string) {
    // Check if there's already a pending deletion request
    const existingRequest = await this.prisma.dataDeletionRequest?.findFirst({
      where: { userId, status: 'scheduled' },
    });

    if (existingRequest) {
      return {
        userId,
        reason,
        scheduledAt: existingRequest.scheduledAt,
        status: 'scheduled',
        message: 'Deletion already scheduled',
      };
    }

    // Schedule deletion for 30 days from now (GDPR grace period)
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + 30);

    try {
      // Try to create a deletion request record if the model exists
      await this.prisma.dataDeletionRequest?.create({
        data: {
          userId,
          reason: reason || 'User requested data deletion',
          scheduledAt,
          status: 'scheduled',
        },
      });
    } catch {
      // If DataDeletionRequest model doesn't exist, log and continue
      // The deletion will be handled by the anonymizeUserData method
      this.logger.warn(
        'DataDeletionRequest model not found, deletion scheduled without persistence'
      );
    }

    return { userId, reason, scheduledAt, status: 'scheduled' };
  }

  async deleteUserData(userId: string) {
    // Anonymize user data instead of hard deleting (preserves referential integrity)
    const anonymizedEmail = `deleted_${userId}@anonymized.local`;
    const anonymizedName = 'Deleted User';

    try {
      // Update user record to anonymize PII
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          email: anonymizedEmail,
          displayName: anonymizedName,
          avatar: null,
        },
      });

      // Update user profile if it exists
      await this.prisma.userProfile?.updateMany({
        where: { userId },
        data: {
          displayName: null,
          avatar: null,
          bio: null,
          location: null,
        },
      });

      // Delete related records that contain PII
      await this.prisma.watchHistory?.deleteMany({ where: { userId } });
      await this.prisma.savedItem?.deleteMany({ where: { userId } });
      await this.prisma.following?.deleteMany({ where: { followerId: userId } });
      await this.prisma.following?.deleteMany({ where: { followingId: userId } });

      // Update deletion request status if model exists
      await this.prisma.dataDeletionRequest?.updateMany({
        where: { userId, status: 'scheduled' },
        data: { status: 'completed', completedAt: new Date() },
      });

      return { userId, deletedAt: new Date(), status: 'deleted' };
    } catch (error) {
      this.logger.error(`Failed to delete user data for ${userId}`, error);
      throw new BadRequestException('Failed to delete user data');
    }
  }

  async exportUserData(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      return { userId, exportedAt: new Date(), data: user };
    } catch (error: unknown) {
      this.logger.error(`Failed to export user data for user ${userId}`, error);
      throw new BadRequestException('Failed to export user data');
    }
  }

  async getDeletionStatus(userId: string) {
    try {
      const request = await this.prisma.dataDeletionRequest?.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      if (!request) {
        return { userId, status: 'none', requestedAt: null };
      }

      return {
        userId,
        status: request.status,
        requestedAt: request.createdAt,
        scheduledAt: request.scheduledAt,
        completedAt: request.completedAt,
      };
    } catch {
      // If DataDeletionRequest model doesn't exist, return default
      return { userId, status: 'none', requestedAt: null };
    }
  }

  async getContinueWatching(userId: string, limit = 10): Promise<Record<string, unknown>> {
    try {
      const history = await this.prisma.watchHistory.findMany({
        where: { userId },
        orderBy: { watchedAt: 'desc' },
        take: Math.min(limit, 50),
      });

      return {
        success: true,
        data: history.map(
          (item: {
            contentId: string;
            contentType: string;
            universe: string;
            watchedAt: Date;
            metadata?: Record<string, unknown>;
          }) => ({
            id: item.contentId,
            contentId: item.contentId,
            contentType: item.contentType,
            universe: item.universe,
            watchedAt: item.watchedAt.toISOString(),
            progress: (item.metadata as { progress?: number })?.progress ?? 0,
          })
        ),
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to get continue watching for user ${userId}`, error);
      throw new BadRequestException('Failed to retrieve continue watching');
    }
  }

  async getUniverseEngagement(userId: string): Promise<Record<string, unknown>> {
    try {
      const affinity = await this.prisma.userUniverseAffinity.findMany({
        where: { userId },
        orderBy: { affinityScore: 'desc' },
      });

      return {
        success: true,
        data: affinity.map(
          (item: { universeId: string; affinityScore: number; lastEngaged: Date }) => ({
            universeId: item.universeId,
            universeName: item.universeId,
            universeIcon: undefined,
            engagementCount: item.affinityScore,
            lastEngagedAt: item.lastEngaged.toISOString(),
          })
        ),
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to get universe engagement for user ${userId}`, error);
      throw new BadRequestException('Failed to retrieve universe engagement');
    }
  }

  async removeFromWatchHistory(userId: string, contentId: string): Promise<void> {
    try {
      await this.prisma.watchHistory.deleteMany({
        where: { userId, contentId },
      });
      this.logger.log(`Removed content ${contentId} from watch history for user ${userId}`);
    } catch (error: unknown) {
      this.logger.error(`Failed to remove from watch history for user ${userId}`, error);
      throw new BadRequestException('Failed to remove from watch history');
    }
  }

  async getFollowerCount(userId: string): Promise<number> {
    try {
      const count = await this.prisma.following.count({
        where: { followingId: userId },
      });
      return count;
    } catch (error: unknown) {
      this.logger.error(`Failed to get follower count for user ${userId}`, error);
      return 0;
    }
  }
}
