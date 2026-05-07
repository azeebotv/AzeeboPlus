import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUniverseAffinityDto } from './dto/update-universe-affinity.dto';

interface UserResponse {
  id: string;
  email: string;
  displayName: string | null;
  avatar: string | null;
  role: string;
  preferences: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

interface WatchHistoryItem {
  id: string;
  userId: string;
  contentId: string;
  contentType: string;
  universe: string;
  progress: number;
  createdAt: Date;
}

interface SavedItem {
  id: string;
  userId: string;
  contentId: string;
  createdAt: Date;
}

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

  async findById(id: string): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatar: true,
        role: true,
        preferences: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user as UserResponse;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponse> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...updateUserDto,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatar: true,
        role: true,
        preferences: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user as UserResponse;
  }

  async getPreferences(userId: string): Promise<Record<string, unknown>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return (user.preferences || {}) as Record<string, unknown>;
  }

  async updatePreferences(
    userId: string,
    preferences: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const existingPrefs = (user.preferences || {}) as Record<string, unknown>;

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        preferences: {
          ...existingPrefs,
          ...preferences,
        },
        updatedAt: new Date(),
      },
    });

    return (updatedUser.preferences || {}) as Record<string, unknown>;
  }

  async getWatchHistory(userId: string): Promise<WatchHistoryItem[]> {
    return this.prisma.watchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }) as Promise<WatchHistoryItem[]>;
  }

  async getSavedItems(userId: string): Promise<SavedItem[]> {
    return this.prisma.savedItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }) as Promise<SavedItem[]>;
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
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        preferences: true,
        watchHistory: {
          select: {
            contentType: true,
            universe: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const universeCounts: Record<string, number> = {};
    (user.watchHistory as Array<{ universe?: string }>).forEach((history) => {
      const universe = history.universe || 'unknown';
      universeCounts[universe] = (universeCounts[universe] || 0) + 1;
    });

    const prefs = (user.preferences || {}) as { interests?: string[] };
    return {
      userId,
      interests: prefs.interests || [],
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
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const existingPrefs = (user.preferences || {}) as { interests?: string[] };

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        preferences: {
          ...existingPrefs,
          interests: dto.interests,
        },
        updatedAt: new Date(),
      },
    });

    const newPrefs = (updatedUser.preferences || {}) as { interests?: string[] };
    return {
      message: 'Universe affinity updated',
      interests: newPrefs.interests || [],
    };
  }
}
