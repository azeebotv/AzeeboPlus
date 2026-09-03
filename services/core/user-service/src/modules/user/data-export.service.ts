/**
 * Data Export Service (GDPR Data Portability)
 * PRIV-003: Add data export API
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

export interface UserDataExport {
  profile: unknown;
  preferences: unknown;
  watchHistory: unknown[];
  savedItems: unknown[];
  following: unknown[];
  universeAffinities: unknown[];
  exportedAt: string;
}

@Injectable()
export class DataExportService {
  private readonly logger = new Logger(DataExportService.name);
  constructor(private readonly prisma: PrismaService) {}

  async exportUserData(userId: string): Promise<UserDataExport> {
    this.logger.log(`Data export requested for user: ${userId}`);

    const [profile, preferences, watchHistory, savedItems, following, universeAffinities] =
      await Promise.all([
        this.prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true, displayName: true, createdAt: true },
        }),
        this.prisma.userPreferences.findUnique({
          where: { userId },
        }),
        this.prisma.watchHistory.findMany({
          where: { userId },
          select: { contentId: true, contentType: true, universe: true, watchedAt: true },
        }),
        this.prisma.savedItem.findMany({
          where: { userId },
          select: { contentId: true, createdAt: true },
        }),
        this.prisma.following.findMany({
          where: { followerId: userId },
          select: { followingId: true, createdAt: true },
        }),
        this.prisma.userUniverseAffinity.findMany({
          where: { userId },
          select: { universeId: true, affinityScore: true, lastEngaged: true },
        }),
      ]);

    return {
      profile,
      preferences,
      watchHistory,
      savedItems,
      following,
      universeAffinities,
      exportedAt: new Date().toISOString(),
    };
  }
}
