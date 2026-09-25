import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service.js';
import { FeatureFlagService, subscriptionFlags } from '@azeebo/feature-flags';
import axios from 'axios';

export interface DeviceCheckResult {
  allowed: boolean;
  activeDevices: number;
  maxDevices: number;
  source: 'plan' | 'default';
  message?: string;
}

@Injectable()
export class DeviceLimitService {
  private readonly logger = new Logger(DeviceLimitService.name);
  private readonly subscriptionServiceUrl: string;

  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(ConfigService) private config: ConfigService,
    @Inject(FeatureFlagService) private readonly featureFlagService: FeatureFlagService
  ) {
    this.subscriptionServiceUrl = this.config.get<string>(
      'SUBSCRIPTION_SERVICE_URL',
      'http://subscription-service:3010'
    );
  }

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

      // subscription_device_limits: when on, the device cap comes from the
      // user's active subscription plan (plan.maxDevices) instead of the
      // DEFAULT_MAX_DEVICES env default. Falls back to the default when the
      // user has no active subscription or the subscription-service is down.
      let maxDevices = this.config.get<number>('DEFAULT_MAX_DEVICES', 1);
      let source: 'plan' | 'default' = 'default';
      try {
        if (await this.featureFlagService.isEnabled(subscriptionFlags.deviceLimits, userId)) {
          const planMax = await this.fetchPlanMaxDevices(userId);
          if (planMax !== null && planMax > 0) {
            maxDevices = planMax;
            source = 'plan';
          }
        }
      } catch (error) {
        this.logger.warn(`subscription_device_limits unavailable, using default cap: ${error}`);
      }

      return {
        allowed: activeDevices < maxDevices,
        activeDevices,
        maxDevices,
        source,
        message:
          activeDevices >= maxDevices
            ? `Device limit reached (${activeDevices}/${maxDevices}). Revoke a device to continue.`
            : undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to check device limit: ${error}`);
      return { allowed: true, activeDevices: 0, maxDevices: 1, source: 'default' };
    }
  }

  /**
   * Fetches the user's active subscription plan's maxDevices from the
   * subscription-service, forwarding the user identity the same way the
   * gateway does (x-user-id + x-gateway-secret) so ServiceAuthGuard accepts it.
   * Returns null when the user has no active subscription or the fetch fails.
   */
  private async fetchPlanMaxDevices(userId: string): Promise<number | null> {
    const secret = process.env.GATEWAY_SECRET || process.env.INTERNAL_API_KEY;
    if (!secret) return null;

    try {
      const response = await axios.get(`${this.subscriptionServiceUrl}/v1/subscriptions/current`, {
        headers: {
          'x-user-id': userId,
          'x-gateway-secret': secret,
        },
        timeout: 5000,
      });
      const subscription = response.data?.data;
      const planMax = subscription?.plan?.maxDevices;
      return typeof planMax === 'number' && planMax > 0 ? planMax : null;
    } catch (error) {
      this.logger.warn(`Failed to fetch plan device limit for user ${userId}: ${error}`);
      return null;
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
