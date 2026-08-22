/**
 * Data Export Service (GDPR Data Portability)
 * PRIV-003: Add data export API
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

export interface UserDataExport {
  profile: unknown;
  sessions: unknown[];
  socialAccounts: unknown[];
  devices: unknown[];
  exportedAt: string;
}

@Injectable()
export class DataExportService {
  private readonly logger = new Logger(DataExportService.name);
  constructor(private readonly prisma: PrismaService) {}

  async exportUserData(userId: string): Promise<UserDataExport> {
    this.logger.log(`Data export requested for user: ${userId}`);
    
    const [profile, sessions, socialAccounts, devices] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, displayName: true, createdAt: true } }),
      this.prisma.session.findMany({ where: { userId }, select: { deviceName: true, createdAt: true } }),
      this.prisma.socialAccount.findMany({ where: { userId }, select: { provider: true, createdAt: true } }),
      this.prisma.registeredDevice.findMany({ where: { userId }, select: { deviceName: true, deviceType: true, registeredAt: true } }),
    ]);

    return { profile, sessions, socialAccounts, devices, exportedAt: new Date().toISOString() };
  }
}
