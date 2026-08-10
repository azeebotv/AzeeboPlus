import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateUniverseDto } from './dto/create-universe.dto';
import { UpdateUniverseDto } from './dto/update-universe.dto';
import { UniverseFeatureFlagDto } from './dto/universe-feature-flag.dto';
import { QueryUniverseDto } from './dto/query-universe.dto';
import { BulkToggleUniverseDto } from './dto/bulk-toggle-universe.dto';
import { CloneUniverseDto } from './dto/clone-universe.dto';
import { ImportUniverseDto } from './dto/import-universe.dto';
import { Prisma } from '../../generated/prisma';
import { InputJsonValue } from '@prisma/client/runtime/library';
import Redis from 'ioredis';

/**
 * Canonical Redis key for a universe-scoped flag, matching the convention in
 * `packages/feature-flags` (`universeFlagKey`): feature_flags:universe.<name>.<feature>.
 */
const FLAG_REDIS_PREFIX = 'feature_flags:';
const universeFlagKey = (universeName: string, feature: string): string =>
  `${FLAG_REDIS_PREFIX}universe.${universeName}.${feature}`;

@Injectable()
export class UniverseManagementService {
  private readonly logger = new Logger(UniverseManagementService.name);
  private redis: Redis | null = null;

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /**
   * Lazily creates the feature-flag Redis client. Failures are non-fatal: the
   * Postgres tables remain the system of record and Redis is a derived runtime
   * cache, so a down flag store must not break admin operations.
   */
  private getFlagRedis(): Redis | null {
    if (this.redis) {
      return this.redis;
    }
    const url =
      process.env.FEATURE_FLAG_REDIS_URL ||
      process.env.REDIS_URL ||
      'redis://localhost:6379';
    try {
      this.redis = new Redis(url, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
      });
      return this.redis;
    } catch (error) {
      this.logger.warn(`Feature flag Redis unavailable (${url}): ${error}`);
      return null;
    }
  }

  /** Publishes a universe flag to the runtime Redis store so services honor it. */
  private async publishFlagToRedis(
    universeName: string,
    featureKey: string,
    isEnabled: boolean,
    metadata?: Record<string, unknown> | null
  ): Promise<void> {
    const redis = this.getFlagRedis();
    if (!redis) return;
    const key = `universe.${universeName}.${featureKey}`;
    try {
      await redis.set(
        universeFlagKey(universeName, featureKey),
        JSON.stringify({
          key,
          enabled: isEnabled,
          description:
            metadata && typeof metadata.description === 'string'
              ? metadata.description
              : undefined,
          rolloutPercentage:
            metadata && typeof metadata.rolloutPercentage === 'number'
              ? metadata.rolloutPercentage
              : undefined,
          userIds: metadata && Array.isArray(metadata.userIds) ? metadata.userIds : undefined,
          metadata: metadata ?? undefined,
          lastToggledBy: 'admin',
        })
      );
      this.logger.log(`Published flag ${key} (enabled=${isEnabled}) to Redis`);
    } catch (error) {
      this.logger.warn(`Failed to publish flag ${key} to Redis: ${error}`);
    }
  }

  /** Removes a universe flag from the runtime Redis store. */
  private async deleteFlagFromRedis(universeName: string, featureKey: string): Promise<void> {
    const redis = this.getFlagRedis();
    if (!redis) return;
    try {
      await redis.del(universeFlagKey(universeName, featureKey));
      this.logger.log(`Removed flag universe.${universeName}.${featureKey} from Redis`);
    } catch (error) {
      this.logger.warn(`Failed to remove flag universe.${universeName}.${featureKey} from Redis: ${error}`);
    }
  }

  /** Publishes the universe-level enabled sentinel used for client nav gating. */
  private async publishUniverseEnabledToRedis(universeName: string, isEnabled: boolean): Promise<void> {
    await this.publishFlagToRedis(universeName, 'enabled', isEnabled);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.quit();
      } catch {
        // Best effort — process is shutting down.
      }
      this.redis = null;
    }
  }

  async getAllUniverses(query: QueryUniverseDto) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        isEnabled,
        sortBy = 'sortOrder',
        sortOrder = 'asc',
      } = query;
      const skip = (page - 1) * limit;

      const where: Prisma.UniverseWhereInput = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { displayName: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (isEnabled !== undefined) {
        where.isEnabled = isEnabled;
      }

      const [universes, total] = await Promise.all([
        this.prisma.universe.findMany({
          where,
          include: {
            featureFlags: true,
            _count: {
              select: {
                contentItems: true,
              },
            },
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        this.prisma.universe.count({ where }),
      ]);

      return {
        data: universes,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
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

  async createUniverse(data: CreateUniverseDto) {
    try {
      const existingUniverse = await this.prisma.universe.findUnique({
        where: { name: data.name },
      });

      if (existingUniverse) {
        throw new ConflictException(`Universe with name "${data.name}" already exists`);
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
          metadata: data.metadata as InputJsonValue,
        },
        include: {
          featureFlags: true,
        },
      });

      await this.publishUniverseEnabledToRedis(universe.name, universe.isEnabled);
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
          metadata: data.metadata as InputJsonValue,
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

      await this.deleteFlagFromRedis(existingUniverse.name, 'enabled');
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

      await this.publishUniverseEnabledToRedis(universe.name, isEnabled);
      this.logger.log(`Toggled universe ${universe.name} to ${isEnabled ? 'enabled' : 'disabled'}`);
      return universe;
    } catch (error) {
      this.logger.error(`Failed to toggle universe ${id}`, error);
      throw error;
    }
  }

  async bulkToggle(data: BulkToggleUniverseDto) {
    try {
      const { ids, isEnabled } = data;

      const existingUniverses = await this.prisma.universe.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true },
      });

      if (existingUniverses.length !== ids.length) {
        const foundIds = new Set(existingUniverses.map((u) => u.id));
        const missingIds = ids.filter((id) => !foundIds.has(id));
        throw new NotFoundException(`Universes not found: ${missingIds.join(', ')}`);
      }

      const result = await this.prisma.universe.updateMany({
        where: { id: { in: ids } },
        data: { isEnabled },
      });

      for (const universe of existingUniverses) {
        await this.publishUniverseEnabledToRedis(universe.name, isEnabled);
      }

      this.logger.log(
        `Bulk toggled ${result.count} universes to ${isEnabled ? 'enabled' : 'disabled'}`
      );

      return {
        message: `Successfully ${isEnabled ? 'enabled' : 'disabled'} ${result.count} universes`,
        count: result.count,
      };
    } catch (error) {
      this.logger.error('Failed to bulk toggle universes', error);
      throw error;
    }
  }

  async getStats() {
    try {
      const [total, enabled, disabled, featureFlagStats, contentCounts] = await Promise.all([
        this.prisma.universe.count(),
        this.prisma.universe.count({ where: { isEnabled: true } }),
        this.prisma.universe.count({ where: { isEnabled: false } }),
        this.prisma.universeFeatureFlag.groupBy({
          by: ['isEnabled'],
          _count: { id: true },
        }),
        this.prisma.contentItem.groupBy({
          by: ['universeId'],
          _count: { id: true },
        }),
      ]);

      const featureFlagsByStatus = featureFlagStats.reduce(
        (acc, stat) => {
          acc[stat.isEnabled ? 'enabled' : 'disabled'] = stat._count.id;
          return acc;
        },
        { enabled: 0, disabled: 0 } as Record<string, number>
      );

      const totalContentItems = contentCounts.reduce((sum, stat) => sum + stat._count.id, 0);

      const contentPerUniverse = contentCounts.reduce(
        (acc, stat) => {
          acc[stat.universeId] = stat._count.id;
          return acc;
        },
        {} as Record<string, number>
      );

      return {
        totalUniverses: total,
        enabledUniverses: enabled,
        disabledUniverses: disabled,
        totalContentItems,
        contentPerUniverse,
        featureFlags: {
          total: featureFlagsByStatus.enabled + featureFlagsByStatus.disabled,
          enabled: featureFlagsByStatus.enabled,
          disabled: featureFlagsByStatus.disabled,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get universe stats', error);
      throw error;
    }
  }

  async cloneUniverse(id: string, data: CloneUniverseDto) {
    try {
      const sourceUniverse = await this.prisma.universe.findUnique({
        where: { id },
        include: { featureFlags: true },
      });

      if (!sourceUniverse) {
        throw new NotFoundException(`Source universe with ID ${id} not found`);
      }

      const existingName = await this.prisma.universe.findUnique({
        where: { name: data.name },
      });

      if (existingName) {
        throw new ConflictException(`Universe with name "${data.name}" already exists`);
      }

      const clonedUniverse = await this.prisma.$transaction(async (tx) => {
        const metadata = data.metadata ?? (sourceUniverse.metadata as Prisma.InputJsonValue | null);

        const newUniverse = await tx.universe.create({
          data: {
            name: data.name,
            displayName: data.displayName || `${sourceUniverse.displayName} (Copy)`,
            description: sourceUniverse.description,
            icon: sourceUniverse.icon,
            color: sourceUniverse.color,
            isEnabled: data.isEnabled ?? false,
            sortOrder: sourceUniverse.sortOrder,
            metadata: metadata === null ? undefined : (metadata as InputJsonValue),
          },
        });

        if (data.copyFeatureFlags !== false && sourceUniverse.featureFlags.length > 0) {
          await tx.universeFeatureFlag.createMany({
            data: sourceUniverse.featureFlags.map((flag) => ({
              universeId: newUniverse.id,
              featureKey: flag.featureKey,
              isEnabled: flag.isEnabled,
              metadata:
                flag.metadata === null ? undefined : (flag.metadata as Prisma.InputJsonValue),
            })),
          });
        }

        return tx.universe.findUnique({
          where: { id: newUniverse.id },
          include: { featureFlags: true },
        });
      });

      this.logger.log(`Cloned universe ${sourceUniverse.name} to ${clonedUniverse!.name}`);
      return clonedUniverse;
    } catch (error) {
      this.logger.error(`Failed to clone universe ${id}`, error);
      throw error;
    }
  }

  async getAllFeatureFlags() {
    try {
      const featureFlags = await this.prisma.universeFeatureFlag.findMany({
        include: {
          universe: {
            select: {
              id: true,
              name: true,
              displayName: true,
            },
          },
        },
        orderBy: [{ universe: { sortOrder: 'asc' } }, { featureKey: 'asc' }],
      });

      return featureFlags;
    } catch (error) {
      this.logger.error('Failed to fetch all feature flags', error);
      throw error;
    }
  }

  async getRelationships() {
    try {
      const universes = await this.prisma.universe.findMany({
        include: {
          featureFlags: {
            select: {
              featureKey: true,
              isEnabled: true,
            },
          },
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

      const relationships = universes.map((universe) => ({
        universeId: universe.id,
        universeName: universe.name,
        displayName: universe.displayName,
        isEnabled: universe.isEnabled,
        contentCount: universe._count.contentItems,
        featureFlags: universe.featureFlags,
        relatedUniverses: universes
          .filter(
            (other) =>
              other.id !== universe.id &&
              other.featureFlags.some((ff) =>
                universe.featureFlags.some((uff) => uff.featureKey === ff.featureKey)
              )
          )
          .map((other) => {
            const sharedFlags = other.featureFlags
              .filter((ff) => universe.featureFlags.some((uff) => uff.featureKey === ff.featureKey))
              .map((ff) => ff.featureKey);
            return {
              universeId: other.id,
              universeName: other.name,
              displayName: other.displayName,
              sharedFeatureFlags: sharedFlags,
            };
          }),
      }));

      return relationships;
    } catch (error) {
      this.logger.error('Failed to fetch universe relationships', error);
      throw error;
    }
  }

  async importUniverses(universes: ImportUniverseDto[]) {
    try {
      const results = await this.prisma.$transaction(async (tx) => {
        const imported = [];
        const skipped = [];
        const errors = [];

        for (const importData of universes) {
          try {
            const existing = await tx.universe.findUnique({
              where: { name: importData.name },
            });

            if (existing) {
              skipped.push({
                name: importData.name,
                reason: 'Universe already exists',
              });
              continue;
            }

            const newUniverse = await tx.universe.create({
              data: {
                name: importData.name,
                displayName: importData.displayName,
                description: importData.description,
                icon: importData.icon,
                color: importData.color,
                isEnabled: importData.isEnabled ?? true,
                sortOrder: importData.sortOrder ?? 0,
                metadata: importData.metadata as InputJsonValue,
              },
            });

            if (importData.featureFlags && importData.featureFlags.length > 0) {
              await tx.universeFeatureFlag.createMany({
                data: importData.featureFlags.map((flag) => ({
                  universeId: newUniverse.id,
                  featureKey: flag.featureKey,
                  isEnabled: flag.isEnabled,
                  metadata: flag.metadata as InputJsonValue,
                })),
              });
            }

            imported.push(newUniverse);
          } catch (err) {
            errors.push({
              name: importData.name,
              error: err instanceof Error ? err.message : 'Unknown error',
            });
          }
        }

        return { imported, skipped, errors };
      });

      this.logger.log(
        `Import completed: ${results.imported.length} imported, ${results.skipped.length} skipped, ${results.errors.length} errors`
      );

      return {
        message: 'Import completed',
        imported: results.imported.length,
        skipped: results.skipped.length,
        errors: results.errors.length,
        details: results,
      };
    } catch (error) {
      this.logger.error('Failed to import universes', error);
      throw error;
    }
  }

  async exportUniverse(id: string) {
    try {
      const universe = await this.prisma.universe.findUnique({
        where: { id },
        include: {
          featureFlags: {
            select: {
              featureKey: true,
              isEnabled: true,
              metadata: true,
            },
          },
        },
      });

      if (!universe) {
        throw new NotFoundException(`Universe with ID ${id} not found`);
      }

      const exportData = {
        name: universe.name,
        displayName: universe.displayName,
        description: universe.description,
        icon: universe.icon,
        color: universe.color,
        isEnabled: universe.isEnabled,
        sortOrder: universe.sortOrder,
        metadata: universe.metadata,
        featureFlags: universe.featureFlags,
        exportedAt: new Date().toISOString(),
      };

      this.logger.log(`Exported universe: ${universe.name}`);
      return exportData;
    } catch (error) {
      this.logger.error(`Failed to export universe ${id}`, error);
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
          metadata: data.metadata as InputJsonValue,
        },
        create: {
          universeId,
          featureKey: data.featureKey,
          isEnabled: data.isEnabled,
          metadata: data.metadata as InputJsonValue,
        },
      });

      await this.publishFlagToRedis(universe.name, data.featureKey, data.isEnabled, data.metadata);
      this.logger.log(`Updated feature flag ${data.featureKey} for universe ${universe.name}`);
      return featureFlag;
    } catch (error) {
      this.logger.error(`Failed to update feature flag for universe ${universeId}`, error);
      throw error;
    }
  }

  async deleteFeatureFlag(universeId: string, featureKey: string) {
    try {
      const universe = await this.prisma.universe.findUnique({
        where: { id: universeId },
        select: { name: true },
      });

      await this.prisma.universeFeatureFlag.delete({
        where: {
          universeId_featureKey: {
            universeId,
            featureKey,
          },
        },
      });

      if (universe) {
        await this.deleteFlagFromRedis(universe.name, featureKey);
      }
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

  async checkFeatureFlag(universeName: string, featureKey: string): Promise<boolean> {
    // Redis is the runtime source of truth — toggles made via the admin UI are
    // published there and take effect without a redeploy or DB read.
    const redis = this.getFlagRedis();
    if (redis) {
      try {
        const raw = await redis.get(universeFlagKey(universeName, featureKey));
        if (raw) {
          const flag = JSON.parse(raw) as { enabled?: boolean };
          return flag.enabled === true;
        }
      } catch (error) {
        this.logger.warn(
          `Redis read failed for ${universeName}.${featureKey}, falling back to DB: ${error}`
        );
      }
    }

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
