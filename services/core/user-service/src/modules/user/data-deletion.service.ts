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
          preferences: null,
          password: '',
          mfaSecret: null,
          mfaBackupCodes: null,
        },
      });
      deletedData.push('user_profile');

      // Delete sessions
      await this.prisma.session.deleteMany({ where: { userId } });
      deletedData.push('sessions');

      // Delete OTPs
      await this.prisma.otp.deleteMany({ where: { userId } });
      deletedData.push('otps');

      // Delete social accounts
      await this.prisma.socialAccount.deleteMany({ where: { userId } });
      deletedData.push('social_accounts');

      // Delete devices
      await this.prisma.registeredDevice.deleteMany({ where: { userId } });
      deletedData.push('devices');

      this.logger.warn(`Data deletion completed for user: ${userId}`);

      return {
        success: true,
        deletedAt: new Date(),
        deletedData,
      };
    } catch (error) {
      this.logger.error(`Data deletion failed for user: ${userId}`, error);
      throw error;
    }
  }
}
