import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Injectable()
export class SystemSettingsService {
  private readonly logger = new Logger(SystemSettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAllSettings() {
    try {
      const settings = await this.prisma.systemSettings.findMany({
        orderBy: {
          category: 'asc',
        },
      });

      return settings;
    } catch (error) {
      this.logger.error('Failed to fetch settings', error);
      throw error;
    }
  }

  async getSettingsByCategory(category: string) {
    try {
      const settings = await this.prisma.systemSettings.findMany({
        where: { category },
      });

      return settings;
    } catch (error) {
      this.logger.error(`Failed to fetch settings for category ${category}`, error);
      throw error;
    }
  }

  async getPublicSettings() {
    try {
      const settings = await this.prisma.systemSettings.findMany({
        where: { isPublic: true },
      });

      return settings;
    } catch (error) {
      this.logger.error('Failed to fetch public settings', error);
      throw error;
    }
  }

  async getSettingByKey(key: string) {
    try {
      const setting = await this.prisma.systemSettings.findUnique({
        where: { key },
      });

      if (!setting) {
        throw new NotFoundException(`Setting with key ${key} not found`);
      }

      return setting;
    } catch (error) {
      this.logger.error(`Failed to fetch setting ${key}`, error);
      throw error;
    }
  }

  async getSettingValue<T = any>(key: string, defaultValue?: T): Promise<T> {
    try {
      const setting = await this.prisma.systemSettings.findUnique({
        where: { key },
      });

      if (!setting) {
        if (defaultValue !== undefined) {
          return defaultValue;
        }
        throw new NotFoundException(`Setting with key ${key} not found`);
      }

      return setting.value as T;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to fetch setting value ${key}`, error);
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw error;
    }
  }

  async createSetting(data: CreateSettingDto) {
    try {
      const existingSetting = await this.prisma.systemSettings.findUnique({
        where: { key: data.key },
      });

      if (existingSetting) {
        throw new BadRequestException(`Setting with key ${data.key} already exists`);
      }

      const setting = await this.prisma.systemSettings.create({
        data: {
          key: data.key,
          value: data.value,
          category: data.category || 'general',
          description: data.description,
          isPublic: data.isPublic ?? false,
        },
      });

      this.logger.log(`Created setting: ${setting.key}`);
      return setting;
    } catch (error) {
      this.logger.error('Failed to create setting', error);
      throw error;
    }
  }

  async updateSetting(key: string, data: UpdateSettingDto) {
    try {
      const existingSetting = await this.prisma.systemSettings.findUnique({
        where: { key },
      });

      if (!existingSetting) {
        throw new NotFoundException(`Setting with key ${key} not found`);
      }

      const setting = await this.prisma.systemSettings.update({
        where: { key },
        data: {
          value: data.value,
          category: data.category,
          description: data.description,
          isPublic: data.isPublic,
        },
      });

      this.logger.log(`Updated setting: ${setting.key}`);
      return setting;
    } catch (error) {
      this.logger.error(`Failed to update setting ${key}`, error);
      throw error;
    }
  }

  async deleteSetting(key: string) {
    try {
      const existingSetting = await this.prisma.systemSettings.findUnique({
        where: { key },
      });

      if (!existingSetting) {
        throw new NotFoundException(`Setting with key ${key} not found`);
      }

      await this.prisma.systemSettings.delete({
        where: { key },
      });

      this.logger.log(`Deleted setting: ${key}`);
      return { message: 'Setting deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete setting ${key}`, error);
      throw error;
    }
  }

  async bulkCreateSettings(settings: CreateSettingDto[]) {
    try {
      const results = [];

      for (const setting of settings) {
        try {
          const created = await this.createSetting(setting);
          results.push({ key: setting.key, success: true, data: created });
        } catch (error) {
          results.push({
            key: setting.key,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return results;
    } catch (error) {
      this.logger.error('Failed to bulk create settings', error);
      throw error;
    }
  }

  async bulkUpdateSettings(settings: { key: string; value: any }[]) {
    try {
      const results = [];

      for (const setting of settings) {
        try {
          const updated = await this.updateSetting(setting.key, { value: setting.value });
          results.push({ key: setting.key, success: true, data: updated });
        } catch (error) {
          results.push({
            key: setting.key,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return results;
    } catch (error) {
      this.logger.error('Failed to bulk update settings', error);
      throw error;
    }
  }

  async getSettingsMap(): Promise<Record<string, any>> {
    try {
      const settings = await this.prisma.systemSettings.findMany({
        where: { isPublic: true },
      });

      const map: Record<string, any> = {};
      settings.forEach((setting: any) => {
        map[setting.key] = setting.value;
      });

      return map;
    } catch (error) {
      this.logger.error('Failed to fetch settings map', error);
      throw error;
    }
  }
}
