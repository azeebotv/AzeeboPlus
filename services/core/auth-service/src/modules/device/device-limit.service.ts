import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service.js';

export interface DeviceCheckResult {
  allowed: boolean;
  activeDevices: number;
  maxDevices: number;
  message?: string;
}

@Injectable()
export class DeviceLimitService {
  private readonly logger = new Logger(DeviceLimitService.name);

  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(ConfigService) private config: ConfigService
  ) {}

  async checkDeviceLimit(userId: string): Promise<DeviceCheckResult> {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      const activeDevices = await this.prisma.registeredDevice.count({
        where: {
          userId,
          revokedAt: null,
          lastActiveAt: { gte: fiveMinutesAgo },
        },
      });

      const maxDevices = this.config.get<number>('DEFAULT_MAX_DEVICES', 1);

      return {
        allowed: activeDevices < maxDevices,
        activeDevices,
        maxDevices,
        message:
          activeDevices >= maxDevices
            ? `Device limit reached (${activeDevices}/${maxDevices}). Revoke a device to continue.`
            : undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to check device limit: ${error}`);
      return { allowed: true, activeDevices: 0, maxDevices: 1 };
    }
  }

  async registerDevice(
    userId: string,
    device: {
      deviceName: string;
      deviceType: string;
      os?: string;
      browser?: string;
      fingerprint?: string;
    }
  ) {
    try {
      const existing = await this.prisma.registeredDevice.findFirst({
        where: {
          userId,
          fingerprint: device.fingerprint || undefined,
          deviceName: device.deviceName,
          revokedAt: null,
        },
      });

      if (existing) {
        await this.prisma.registeredDevice.update({
          where: { id: existing.id },
          data: { lastActiveAt: new Date() },
        });
        return existing;
      }

      return this.prisma.registeredDevice.create({
        data: {
          userId,
          ...device,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to register device: ${error}`);
      throw error;
    }
  }

  async getDevices(userId: string) {
    return this.prisma.registeredDevice.findMany({
      where: { userId, revokedAt: null },
      orderBy: { lastActiveAt: 'desc' },
      select: {
        id: true,
        deviceName: true,
        deviceType: true,
        os: true,
        browser: true,
        isTrusted: true,
        lastActiveAt: true,
        registeredAt: true,
      },
    });
  }

  async revokeDevice(userId: string, deviceId: string) {
    const device = await this.prisma.registeredDevice.findFirst({
      where: { id: deviceId, userId },
    });

    if (!device) {
      return { success: false, message: 'Device not found' };
    }

    await this.prisma.registeredDevice.update({
      where: { id: deviceId },
      data: { revokedAt: new Date() },
    });

    return { success: true, message: 'Device revoked' };
  }

  async updateLastActive(userId: string, deviceName: string) {
    try {
      await this.prisma.registeredDevice.updateMany({
        where: { userId, deviceName, revokedAt: null },
        data: { lastActiveAt: new Date() },
      });
    } catch (error) {
      this.logger.warn(`Failed to update device last active: ${error}`);
    }
  }
}
