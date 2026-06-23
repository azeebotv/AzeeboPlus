import { Controller, Get, Logger } from '@nestjs/common';
import { Public } from '@azeebo/security';
import { PrismaService } from '../database/prisma.service';

@Public()
@Controller('v1/public')
export class PublicController {
  private readonly logger = new Logger(PublicController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get('universes')
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
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Get('settings')
  async getPublicSettings() {
    try {
      const settings = await this.prisma.systemSettings.findMany({
        where: { isPublic: true },
      });

      const settingsMap: Record<string, any> = {};
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
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Get('settings/:key')
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
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Get('universes/:name/features')
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

      const features: Record<string, any> = {};
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
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
