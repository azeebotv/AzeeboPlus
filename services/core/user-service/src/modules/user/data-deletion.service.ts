/**
 * Data Deletion Service (GDPR Right to Erasure)
 * PRIV-002: Add data deletion API
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

export interface DeletionRequest {
  userId: string;
  reason?: string;
  requestedAt: Date;
}

export interface DeletionResult {
  success: boolean;
  deletedAt: Date;
  deletedData: string[];
}

@Injectable()
export class DataDeletionService {
  private readonly logger = new Logger(DataDeletionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async requestDataDeletion(userId: string, reason?: string): Promise<DeletionRequest> {
    this.logger.log(`Data deletion requested for user: ${userId}`);

    return {
      userId,
      reason,
      requestedAt: new Date(),
    };
  }

  async executeDeletion(userId: string): Promise<DeletionResult> {
    this.logger.warn(`Executing data deletion for user: ${userId}`);

    const deletedData: string[] = [];

    try {
      // Anonymize user data instead of hard delete
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          email: `deleted_${userId}@anonymized.local`,
          displayName: 'Deleted User',
          avatar: null,
        },
      });
      deletedData.push('user_profile');

      // Delete preferences
      await this.prisma.userPreferences.deleteMany({ where: { userId } });
      deletedData.push('preferences');

      // Delete watch history
      await this.prisma.watchHistory.deleteMany({ where: { userId } });
      deletedData.push('watch_history');

      // Delete saved items
      await this.prisma.savedItem.deleteMany({ where: { userId } });
      deletedData.push('saved_items');

      // Delete following relationships
      await this.prisma.following.deleteMany({ where: { followerId: userId } });
      deletedData.push('following');

      // Delete universe affinities
      await this.prisma.userUniverseAffinity.deleteMany({ where: { userId } });
      deletedData.push('universe_affinities');

      // Delete audit logs for this user
      await this.prisma.auditLog.deleteMany({ where: { actorId: userId } });
      deletedData.push('audit_logs');

      this.logger.warn(`Data deletion completed for user: ${userId}`);

      return {
        success: true,
        deletedAt: new Date(),
        deletedData,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Data deletion failed for user ${userId}: ${message}`);
      throw error;
    }
  }
}
