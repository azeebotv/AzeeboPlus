import { Inject, Controller, Get, Logger, UseGuards  } from '@nestjs/common';
import { Public, RateLimitGuard, RateLimit } from '@azeebo/security';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../database/prisma.service.js';

@ApiTags('Public')
@Public()
@UseGuards(RateLimitGuard)
@Controller('v1/public')
export class PublicController {
  private readonly logger = new Logger(PublicController.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get('universes')
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'Get enabled universes' })
  @ApiResponse({ status: 200, description: 'Universes retrieved successfully' })
  async getEnabledUniverses() {
    try {
      const universes = await this.prisma.universe.findMany({
        where: { isEnabled: true },
        include: {
          featureFlags: {
            where: { isEnabled: true },
            select: {
              featureKey: true,
              metadata: true,
            },
          },
        },
        orderBy: {
          sortOrder: 'asc',
        },
      });

      return {
        success: true,
        data: universes.map((universe) => ({
          id: universe.id,
          name: universe.name,
          displayName: universe.displayName,
          description: universe.description,
          icon: universe.icon,
          color: universe.color,
          metadata: universe.metadata,
          featureFlags: universe.featureFlags.map((flag) => ({
            key: flag.featureKey,
            metadata: flag.metadata,
          })),
        })),
      };
    } catch (error) {
      this.logger.error('Failed to fetch enabled universes', error);
      return {
        success: false,
        message: 'Failed to fetch universes',
        error: 'Internal server error',
      };
    }
  }

  @Get('settings')
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'Get public system settings' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  async getPublicSettings() {
    try {
      const settings = await this.prisma.systemSettings.findMany({
        where: { isPublic: true },
      });

      const settingsMap: Record<string, unknown> = {};
      settings.forEach((setting) => {
        settingsMap[setting.key] = setting.value;
      });

      return {
        success: true,
        data: settingsMap,
      };
    } catch (error) {
      this.logger.error('Failed to fetch public settings', error);
      return {
        success: false,
        message: 'Failed to fetch settings',
        error: 'Internal server error',
      };
    }
  }

  @Get('settings/:key')
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'Get a public setting by key' })
  @ApiResponse({ status: 200, description: 'Setting retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Setting not found or not public' })
  async getPublicSetting(key: string) {
    try {
      const setting = await this.prisma.systemSettings.findFirst({
        where: {
          key,
          isPublic: true,
        },
      });

      if (!setting) {
        return {
          success: false,
          message: 'Setting not found or not public',
        };
      }

      return {
        success: true,
        data: {
          key: setting.key,
          value: setting.value,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to fetch setting ${key}`, error);
      return {
        success: false,
        message: 'Failed to fetch setting',
        error: 'Internal server error',
      };
    }
  }

  @Get('universes/:name/features')
  @RateLimit(100, 60000)
  @ApiOperation({ summary: 'Get feature flags for a universe' })
  @ApiResponse({ status: 200, description: 'Features retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Universe not found or disabled' })
  async getUniverseFeatures(name: string) {
    try {
      const universe = await this.prisma.universe.findUnique({
        where: { name },
        include: {
          featureFlags: {
            where: { isEnabled: true },
            select: {
              featureKey: true,
              metadata: true,
            },
          },
        },
      });

      if (!universe || !universe.isEnabled) {
        return {
          success: false,
          message: 'Universe not found or disabled',
        };
      }

      const features: Record<string, unknown> = {};
      universe.featureFlags.forEach((flag) => {
        features[flag.featureKey] = {
          enabled: true,
          metadata: flag.metadata,
        };
      });

      return {
        success: true,
        data: {
          universe: universe.name,
          features,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to fetch features for universe ${name}`, error);
      return {
        success: false,
        message: 'Failed to fetch features',
        error: 'Internal server error',
      };
    }
  }
}
