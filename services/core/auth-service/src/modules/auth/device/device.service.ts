import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateDeviceInfoDto } from '../dto/device.dto';
import { DeviceInfo } from './device.controller';

@Injectable()
export class DeviceService {
  private readonly logger = new Logger(DeviceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getUserDevices(userId: string): Promise<DeviceInfo[]> {
    try {
      const sessions = await this.prisma.session.findMany({
        where: {
          userId,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: {
          lastActiveAt: 'desc',
        },
      });

      return sessions.map((session) => ({
        id: session.id,
        deviceName: session.deviceName || 'Unknown Device',
        deviceType: session.deviceType || 'unknown',
        os: session.os || 'unknown',
        browser: session.browser || 'unknown',
        ipAddress: session.ipAddress || 'unknown',
        lastActive: session.lastActiveAt.toISOString(),
        createdAt: session.createdAt.toISOString(),
        isCurrentDevice: false,
      }));
    } catch (error) {
      this.logger.error(`Failed to get user devices: ${error}`);
      return [];
    }
  }

  async revokeDevice(userId: string, deviceId: string): Promise<void> {
    try {
      const session = await this.prisma.session.findFirst({
        where: {
          id: deviceId,
          userId,
        },
      });

      if (!session) {
        throw new NotFoundException('Device session not found');
      }

      await this.prisma.session.delete({
        where: {
          id: deviceId,
        },
      });

      this.logger.log(`Device session ${deviceId} revoked for user ${userId}`);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to revoke device: ${error}`);
      throw error;
    }
  }

  async updateDevice(
    userId: string,
    deviceId: string,
    updateDto: UpdateDeviceInfoDto
  ): Promise<DeviceInfo> {
    try {
      const session = await this.prisma.session.findFirst({
        where: {
          id: deviceId,
          userId,
        },
      });

      if (!session) {
        throw new NotFoundException('Device session not found');
      }

      const updated = await this.prisma.session.update({
        where: {
          id: deviceId,
        },
        data: {
          deviceName: updateDto.deviceName,
        },
      });

      return {
        id: updated.id,
        deviceName: updated.deviceName || 'Unknown Device',
        deviceType: updated.deviceType || 'unknown',
        os: updated.os || 'unknown',
        browser: updated.browser || 'unknown',
        ipAddress: updated.ipAddress || 'unknown',
        lastActive: updated.lastActiveAt.toISOString(),
        createdAt: updated.createdAt.toISOString(),
        isCurrentDevice: false,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to update device: ${error}`);
      throw error;
    }
  }

  async revokeAllOtherDevices(userId: string): Promise<void> {
    try {
      const result = await this.prisma.session.deleteMany({
        where: {
          userId,
        },
      });

      this.logger.log(`Revoked ${result.count} device sessions for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to revoke all devices for user ${userId}: ${error}`);
      throw error;
    }
  }
}
