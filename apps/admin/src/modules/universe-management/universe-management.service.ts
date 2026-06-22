import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateUniverseDto } from './dto/create-universe.dto';
import { UpdateUniverseDto } from './dto/update-universe.dto';
import { UniverseFeatureFlagDto } from './dto/universe-feature-flag.dto';

@Injectable()
export class UniverseManagementService {
  private readonly logger = new Logger(UniverseManagementService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAllUniverses() {
    try {
      const universes = await this.prisma.universe.findMany({
        include: {
          featureFlags: true,
          _count: {
            select: {
              contentItems: true,
            },
          },
        },
        orderBy: {
          sortOrder: 'asc',
        },
      });

      return universes;
    } catch (error) {
      this.logger.error('Failed to fetch universes', error);
      throw error;
    }
  }

  async getUniverseById(id: string) {
    try {
      const universe = await this.prisma.universe.findUnique({
        where: { id },
        include: {
          featureFlags: true,
          _count: {
            select: {
              contentItems: true,
            },
          },
        },
      });

      if (!universe) {
        throw new NotFoundException(`Universe with ID ${id} not found`);
      }

      return universe;
    } catch (error) {
      this.logger.error(`Failed to fetch universe ${id}`, error);
      throw error;
    }
  }

  async getUniverseByName(name: string) {
    try {
      const universe = await this.prisma.universe.findUnique({
        where: { name },
        include: {
          featureFlags: true,
          _count: {
            select: {
              contentItems: true,
            },
          },
        },
      });

      if (!universe) {
        throw new NotFoundException(`Universe with name ${name} not found`);
      }

      return universe;
    } catch (error) {
      this.logger.error(`Failed to fetch universe ${name}`, error);
      throw error;
    }
  }

  async createUniverse(data: CreateUniverseDto) {
    try {
      const existingUniverse = await this.prisma.universe.findUnique({
        where: { name: data.name },
      });

      if (existingUniverse) {
        throw new BadRequestException(`Universe with name ${data.name} already exists`);
      }

      const universe = await this.prisma.universe.create({
        data: {
          name: data.name,
          displayName: data.displayName,
          description: data.description,
          icon: data.icon,
          color: data.color,
          isEnabled: data.isEnabled ?? true,
          sortOrder: data.sortOrder ?? 0,
          metadata: data.metadata,
        },
        include: {
          featureFlags: true,
        },
      });

      this.logger.log(`Created universe: ${universe.name}`);
      return universe;
    } catch (error) {
      this.logger.error('Failed to create universe', error);
      throw error;
    }
  }

  async updateUniverse(id: string, data: UpdateUniverseDto) {
    try {
      const existingUniverse = await this.prisma.universe.findUnique({
        where: { id },
      });

      if (!existingUniverse) {
        throw new NotFoundException(`Universe with ID ${id} not found`);
      }

      const universe = await this.prisma.universe.update({
        where: { id },
        data: {
          displayName: data.displayName,
          description: data.description,
          icon: data.icon,
          color: data.color,
          isEnabled: data.isEnabled,
          sortOrder: data.sortOrder,
          metadata: data.metadata,
        },
        include: {
          featureFlags: true,
        },
      });

      this.logger.log(`Updated universe: ${universe.name}`);
      return universe;
    } catch (error) {
      this.logger.error(`Failed to update universe ${id}`, error);
      throw error;
    }
  }

  async deleteUniverse(id: string) {
    try {
      const existingUniverse = await this.prisma.universe.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              contentItems: true,
            },
          },
        },
      });

      if (!existingUniverse) {
        throw new NotFoundException(`Universe with ID ${id} not found`);
      }

      if (existingUniverse._count.contentItems > 0) {
        throw new BadRequestException(
          `Cannot delete universe with ${existingUniverse._count.contentItems} content items. Please move or delete content first.`
        );
      }

      await this.prisma.universe.delete({
        where: { id },
      });

      this.logger.log(`Deleted universe: ${existingUniverse.name}`);
      return { message: 'Universe deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete universe ${id}`, error);
      throw error;
    }
  }

  async toggleUniverse(id: string, isEnabled: boolean) {
    try {
      const universe = await this.prisma.universe.update({
        where: { id },
        data: { isEnabled },
        include: {
          featureFlags: true,
        },
      });

      this.logger.log(`Toggled universe ${universe.name} to ${isEnabled ? 'enabled' : 'disabled'}`);
      return universe;
    } catch (error) {
      this.logger.error(`Failed to toggle universe ${id}`, error);
      throw error;
    }
  }

  async updateFeatureFlag(universeId: string, data: UniverseFeatureFlagDto) {
    try {
      const universe = await this.prisma.universe.findUnique({
        where: { id: universeId },
      });

      if (!universe) {
        throw new NotFoundException(`Universe with ID ${universeId} not found`);
      }

      const featureFlag = await this.prisma.universeFeatureFlag.upsert({
        where: {
          universeId_featureKey: {
            universeId,
            featureKey: data.featureKey,
          },
        },
        update: {
          isEnabled: data.isEnabled,
          metadata: data.metadata,
        },
        create: {
          universeId,
          featureKey: data.featureKey,
          isEnabled: data.isEnabled,
          metadata: data.metadata,
        },
      });

      this.logger.log(`Updated feature flag ${data.featureKey} for universe ${universe.name}`);
      return featureFlag;
    } catch (error) {
      this.logger.error(`Failed to update feature flag for universe ${universeId}`, error);
      throw error;
    }
  }

  async deleteFeatureFlag(universeId: string, featureKey: string) {
    try {
      await this.prisma.universeFeatureFlag.delete({
        where: {
          universeId_featureKey: {
            universeId,
            featureKey,
          },
        },
      });

      this.logger.log(`Deleted feature flag ${featureKey} for universe ${universeId}`);
      return { message: 'Feature flag deleted successfully' };
    } catch (error) {
      this.logger.error(
        `Failed to delete feature flag ${featureKey} for universe ${universeId}`,
        error
      );
      throw error;
    }
  }

  async getEnabledUniverses() {
    try {
      const universes = await this.prisma.universe.findMany({
        where: { isEnabled: true },
        include: {
          featureFlags: {
            where: { isEnabled: true },
          },
        },
        orderBy: {
          sortOrder: 'asc',
        },
      });

      return universes;
    } catch (error) {
      this.logger.error('Failed to fetch enabled universes', error);
      throw error;
    }
  }

  async checkFeatureFlag(universeName: string, featureKey: string): Promise<boolean> {
    try {
      const universe = await this.prisma.universe.findUnique({
        where: { name: universeName },
        include: {
          featureFlags: {
            where: { featureKey },
          },
        },
      });

      if (!universe || !universe.isEnabled) {
        return false;
      }

      const flag = universe.featureFlags[0];
      return flag ? flag.isEnabled : false;
    } catch (error) {
      this.logger.error(
        `Failed to check feature flag ${featureKey} for universe ${universeName}`,
        error
      );
      return false;
    }
  }
}
