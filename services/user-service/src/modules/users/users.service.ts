import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUniverseAffinityDto } from './dto/update-universe-affinity.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
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

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
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

    return user;
  }

  async getPreferences(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return (user.preferences || {}) as any;
  }

  async updatePreferences(userId: string, preferences: Record<string, any>) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const existingPrefs = (user.preferences || {}) as any;

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

    return updatedUser.preferences;
  }

  async getWatchHistory(userId: string) {
    return this.prisma.watchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getSavedItems(userId: string) {
    return this.prisma.savedItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async saveItem(userId: string, contentId: string) {
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

  async unsaveItem(userId: string, contentId: string) {
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

  async getUniverseAffinity(userId: string) {
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

    // Calculate universe affinity based on watch history
    const universeCounts: Record<string, number> = {};
    (user.watchHistory as unknown[]).forEach((history) => {
      const universe = history.universe || 'unknown';
      universeCounts[universe] = (universeCounts[universe] || 0) + 1;
    });

    const prefs = (user.preferences || {}) as any;
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

  async updateUniverseAffinity(userId: string, dto: UpdateUniverseAffinityDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const existingPrefs = (user.preferences || {}) as any;

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

    const newPrefs = (updatedUser.preferences || {}) as any;
    return {
      message: 'Universe affinity updated',
      interests: newPrefs.interests || [],
    };
  }
}
