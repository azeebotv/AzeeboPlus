import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { resolveFeatureFlagRedisUrl } from '@azeebo/feature-flags';
import { PrismaService } from '../../database/prisma.service';
import { AuditLogService } from '../audit/audit.service';
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

/** Backoff between publish attempts — transient Redis blips should not drift the store. */
const PUBLISH_RETRY_BACKOFF_MS = [100, 250];

@Injectable()
export class UniverseManagementService implements OnApplicationBootstrap {
  private readonly logger = new Logger(UniverseManagementService.name);
  private redis: Redis | null = null;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditLogService) private readonly auditService: AuditLogService
  ) {}

  /**
   * Lazily creates the feature-flag Redis client. Failures are non-fatal: the
   * Postgres tables remain the system of record and Redis is a derived runtime
   * cache, so a down flag store must not break admin operations.
   */
  private getFlagRedis(): Redis | null {
    if (this.redis) {
      return this.redis;
    }
    // Same resolver the FeatureFlagService uses — the publisher MUST land on
    // the same DB index as the cache or universe flags go invisible to every
    // consumer (they share the feature_flags:* keyspace).
    const url = resolveFeatureFlagRedisUrl(
      process.env.FEATURE_FLAG_REDIS_URL || process.env.REDIS_URL || 'redis://localhost:6379'
    );
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

  /**
   * Publishes a universe flag to the runtime Redis store so services honor it.
   * Returns whether the publish succeeded (after up to 2 retries with small
   * backoff) — callers surface failures as `flagSync` so a swallowed Redis
   * error never leaves Postgres and Redis silently diverging.
   */
  private async publishFlagToRedis(
    universeName: string,
    featureKey: string,
    isEnabled: boolean,
    metadata?: Record<string, unknown> | null
  ): Promise<boolean> {
    const redis = this.getFlagRedis();
    if (!redis) return false;
    const key = `universe.${universeName}.${featureKey}`;
    const payload = JSON.stringify({
      key,
      enabled: isEnabled,
      description:
        metadata && typeof metadata.description === 'string' ? metadata.description : undefined,
      rolloutPercentage:
        metadata && typeof metadata.rolloutPercentage === 'number'
          ? metadata.rolloutPercentage
          : undefined,
      userIds: metadata && Array.isArray(metadata.userIds) ? metadata.userIds : undefined,
      metadata: metadata ?? undefined,
      lastToggledBy: 'admin',
    });
    for (let attempt = 0; ; attempt += 1) {
      try {
        await redis.set(universeFlagKey(universeName, featureKey), payload);
        this.logger.log(`Published flag ${key} (enabled=${isEnabled}) to Redis`);
        return true;
      } catch (error) {
        if (attempt >= PUBLISH_RETRY_BACKOFF_MS.length) {
          this.logger.warn(
            `Failed to publish flag ${key} to Redis after ${attempt + 1} attempts: ${error}`
          );
          return false;
        }
        this.logger.warn(`Flag publish ${key} failed (attempt ${attempt + 1}), retrying: ${error}`);
        await new Promise((resolve) => setTimeout(resolve, PUBLISH_RETRY_BACKOFF_MS[attempt]));
      }
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
      this.logger.warn(
        `Failed to remove flag universe.${universeName}.${featureKey} from Redis: ${error}`
      );
    }
  }

  /** Publishes the universe-level enabled sentinel used for client nav gating. */
  private async publishUniverseEnabledToRedis(
    universeName: string,
    isEnabled: boolean
  ): Promise<boolean> {
    return this.publishFlagToRedis(universeName, 'enabled', isEnabled);
  }

  /** Shape returned by toggle/bulk/update/create: did Redis get the sentinel, and for which keys. */
  private flagSync(failedKeys: string[]): { ok: boolean; failedKeys: string[] } {
    return { ok: failedKeys.length === 0, failedKeys };
  }

  /** Sentinel Redis key for a universe name (the `universe.<name>.enabled` nav flag). */
  private enabledKey(universeName: string): string {
    return `universe.${universeName}.enabled`;
  }

  /**
   * Audits a swallowed Redis publish so the drift is on record (Postgres is the
   * source of truth; `resyncUniverse` heals it). Fail-open: never masks the
   * caller's own response.
   */
  private async auditFlagSyncFailure(
    targetId: string,
    actorId: string | undefined,
    details: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.auditService.log({
        actorId: actorId ?? 'system',
        action: 'universe.flag_sync_failed',
        targetType: 'universe',
        targetId,
        details,
      });
    } catch (error) {
      this.logger.warn(`Failed to audit flag-sync failure for ${targetId}: ${error}`);
    }
  }

  /**
   * Republishes one universe's enabled sentinel from Postgres truth — the manual
   * heal for a `flagSync.ok === false` response (Redis write failed after
   * retries, so the runtime store still holds the previous state).
   */
  async resyncUniverse(id: string, actorId?: string) {
    const universe = await this.prisma.universe.findUnique({ where: { id } });
    if (!universe) {
      throw new NotFoundException(`Universe with ID ${id} not found`);
    }
    const published = await this.publishUniverseEnabledToRedis(universe.name, universe.isEnabled);
    if (!published) {
      await this.auditFlagSyncFailure(universe.id, actorId, {
        key: this.enabledKey(universe.name),
        reason: 'redis_unavailable',
        via: 'resync',
      });
    }
    return {
      id: universe.id,
      name: universe.name,
      isEnabled: universe.isEnabled,
      flagSync: this.flagSync(published ? [] : [this.enabledKey(universe.name)]),
    };
  }

  /**
   * At boot, republish every universe's enabled sentinel from Postgres truth —
   * Redis is a derived cache, so a restart heals any drift from writes that
   * failed while Redis was down. Reserved canonical slugs with no DB row (e.g.
   * `music`) get an enabled row first so they become toggleable like the rest.
   */
  async onApplicationBootstrap(): Promise<void> {
    await this.ensureReservedUniverseRows();
    try {
      const universes = await this.prisma.universe.findMany({
        select: { name: true, isEnabled: true },
      });
      const failed: string[] = [];
      for (const universe of universes) {
        const published = await this.publishUniverseEnabledToRedis(
          universe.name,
          universe.isEnabled
        );
        if (!published) failed.push(this.enabledKey(universe.name));
      }
      if (failed.length > 0) {
        this.logger.warn(
          `Boot sentinel republish incomplete (${failed.length}/${universes.length}): ${failed.join(', ')}`
        );
      } else {
        this.logger.log(`Republished ${universes.length} universe enabled sentinels to Redis`);
      }
    } catch (error) {
      this.logger.warn(`Boot sentinel republish skipped (DB unavailable): ${error}`);
    }
  }

  /**
   * Creates `universes` rows for canonical slugs that have no admin row yet.
   * The gateway derives its sentinel defaults from `UNIVERSE_SLUGS` (Part 2
   * convention), so without a row there is nothing for the admin UI to toggle
   * and no publisher for the key — the universe would be permanently ON.
   */
  private async ensureReservedUniverseRows(): Promise<void> {
    // `music` is the reserved slug documented in packages/shared-types/src/universe.ts;
    // other UNIVERSE_SLUGS entries are seeded via prisma/seed/universes*.sql.
    const reservedSlugs: Array<{ slug: string; displayName: string }> = [
      { slug: 'music', displayName: 'Music' },
    ];
    try {
      for (const { slug, displayName } of reservedSlugs) {
        const existing = await this.prisma.universe.findUnique({ where: { name: slug } });
        if (existing) continue;
        await this.prisma.universe.create({
          data: {
            name: slug,
            displayName,
            description: `Reserved universe: ${slug}`,
            isEnabled: true,
            sortOrder: 100,
            metadata: { reserved: true } as InputJsonValue,
          },
        });
        this.logger.log(`Created reserved universe row: ${slug}`);
      }
    } catch (error) {
      this.logger.warn(`Reserved universe row bootstrap skipped (DB unavailable): ${error}`);
    }
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
      const pageNum = Math.max(1, Number(query.page) || 1);
      const limitNum = Math.max(1, Math.min(100, Number(query.limit) || 20));
      const {
        search,
        isEnabled,
        sortBy = 'sortOrder',
        sortOrder = 'asc',
      } = query;
      const skip = (pageNum - 1) * limitNum;

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
          take: limitNum,
        }),
        this.prisma.universe.count({ where }),
      ]);

      // Map Prisma's _count into the contentCount field the admin SPA's
      // AdminUniverse contract expects (raw _count renders as 0 on the cards).
      const items = universes.map((u) => {
        const { _count, ...rest } = u as typeof u & { _count?: { contentItems: number } };
        return { ...rest, contentCount: _count?.contentItems ?? 0 };
      });

      return {
        data: items,
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
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

  async createUniverse(data: CreateUniverseDto, actorId?: string) {
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

      const published = await this.publishUniverseEnabledToRedis(universe.name, universe.isEnabled);
      const failedKeys = published ? [] : [this.enabledKey(universe.name)];
      if (!published)
        await this.auditFlagSyncFailure(universe.id, actorId, {
          key: this.enabledKey(universe.name),
          reason: 'redis_unavailable',
          via: 'create',
        });
      this.logger.log(`Created universe: ${universe.name}`);
      return { ...universe, flagSync: this.flagSync(failedKeys) };
    } catch (error) {
      this.logger.error('Failed to create universe', error);
      throw error;
    }
  }

  async updateUniverse(id: string, data: UpdateUniverseDto, actorId?: string) {
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

      // The edit page can change the enabled state too — keep the runtime nav
      // sentinel in sync (same key the toggles publish: universe.<name>.enabled)
      // so web/mobile nav gating follows edits, not just toggle/bulk/create.
      let flagSync: { ok: boolean; failedKeys: string[] } | undefined;
      if (data.isEnabled !== undefined) {
        const published = await this.publishUniverseEnabledToRedis(
          universe.name,
          universe.isEnabled
        );
        flagSync = this.flagSync(published ? [] : [this.enabledKey(universe.name)]);
        if (!published)
          await this.auditFlagSyncFailure(universe.id, actorId, {
            key: this.enabledKey(universe.name),
            reason: 'redis_unavailable',
            via: 'update',
          });
      }

      this.logger.log(`Updated universe: ${universe.name}`);
      return flagSync ? { ...universe, flagSync } : universe;
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

  async toggleUniverse(id: string, isEnabled: boolean, actorId?: string) {
    try {
      const universe = await this.prisma.universe.update({
        where: { id },
        data: { isEnabled },
        include: {
          featureFlags: true,
        },
      });

      const published = await this.publishUniverseEnabledToRedis(universe.name, isEnabled);
      const failedKeys = published ? [] : [this.enabledKey(universe.name)];
      if (!published)
        await this.auditFlagSyncFailure(universe.id, actorId, {
          key: this.enabledKey(universe.name),
          reason: 'redis_unavailable',
          via: 'toggle',
        });
      this.logger.log(
        `Toggled universe ${universe.name} to ${isEnabled ? 'enabled' : 'disabled'}${
          published ? '' : ' (Redis publish FAILED)'
        }`
      );
      return { ...universe, flagSync: this.flagSync(failedKeys) };
    } catch (error) {
      this.logger.error(`Failed to toggle universe ${id}`, error);
      throw error;
    }
  }

  async bulkToggle(data: BulkToggleUniverseDto, actorId?: string) {
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

      const failedKeys: string[] = [];
      for (const universe of existingUniverses) {
        const published = await this.publishUniverseEnabledToRedis(universe.name, isEnabled);
        if (!published) failedKeys.push(this.enabledKey(universe.name));
      }
      if (failedKeys.length > 0) {
        await this.auditFlagSyncFailure(ids.join(','), actorId, {
          keys: failedKeys,
          reason: 'redis_unavailable',
          via: 'bulk',
        });
      }

      this.logger.log(
        `Bulk toggled ${result.count} universes to ${isEnabled ? 'enabled' : 'disabled'}` +
          (failedKeys.length > 0 ? ` (${failedKeys.length} Redis publishes FAILED)` : '')
      );

      return {
        message: `Successfully ${isEnabled ? 'enabled' : 'disabled'} ${result.count} universes`,
        count: result.count,
        flagSync: this.flagSync(failedKeys),
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

  /**
   * Batch-removes universe flags whose `metadata.staleAfter` has passed,
   * archiving each one (full snapshot → `feature_flag.deleted` audit with
   * `targetType: 'universe_feature_flag'`) BEFORE the hard delete — the same
   * archive-before-remove contract as the global prune, so a removed universe
   * flag can later be restored from the audit log. `keys` optionally restricts
   * the batch to a confirmed subset; a key that isn't actually past its
   * staleAfter is still skipped. One failing key never aborts the rest.
   */
  async pruneStaleFeatureFlags(
    actorId?: string,
    keys?: Array<{ universeId: string; featureKey: string }>
  ) {
    const flags = await this.getAllFeatureFlags();
    const now = Date.now();
    const keySet = keys ? new Set(keys.map((k) => `${k.universeId}:${k.featureKey}`)) : null;

    const targets = flags.filter((f) => {
      const meta = (f.metadata ?? {}) as Record<string, unknown>;
      const staleAfter = meta.staleAfter;
      const isStale =
        typeof staleAfter === 'string' &&
        !Number.isNaN(Date.parse(staleAfter)) &&
        Date.parse(staleAfter) <= now;
      if (!isStale) return false;
      return !keySet || keySet.has(`${f.universeId}:${f.featureKey}`);
    });

    const removed: Array<{ key: string; archived: boolean }> = [];
    const skipped: string[] = [];
    for (const flag of targets) {
      const key = `${flag.universe.name}.${flag.featureKey}`;
      try {
        await this.archiveFeatureFlag(flag, actorId);
        await this.deleteFeatureFlag(flag.universeId, flag.featureKey);
        removed.push({ key, archived: true });
      } catch (error) {
        skipped.push(key);
        this.logger.warn(`Failed to prune stale universe flag ${key}: ${(error as Error).message}`);
      }
    }

    this.logger.log(
      `Pruned ${removed.length} stale universe flag(s)${skipped.length ? `, skipped ${skipped.length}` : ''} by ${actorId ?? 'unknown'}`
    );
    return {
      success: true,
      data: {
        removedCount: removed.length,
        removedKeys: removed.map((r) => r.key),
        archivedCount: removed.filter((r) => r.archived).length,
        skipped,
      },
    };
  }

  /** Archives a universe flag's last-known state to the audit log before removal. */
  private async archiveFeatureFlag(
    flag: Awaited<ReturnType<UniverseManagementService['getAllFeatureFlags']>>[number],
    actorId?: string
  ): Promise<void> {
    await this.auditService.log({
      actorId,
      actorType: 'admin',
      action: 'feature_flag.deleted',
      targetType: 'universe_feature_flag',
      targetId: `${flag.universe.name}.${flag.featureKey}`,
      details: {
        archivedSnapshot: {
          featureKey: flag.featureKey,
          universeId: flag.universeId,
          universeName: flag.universe.name,
          universeDisplayName: flag.universe.displayName,
          isEnabled: flag.isEnabled,
          metadata: flag.metadata,
          archivedAt: new Date().toISOString(),
        },
      },
    });
  }

  /**
   * Undo path for prune/remove: replays the flag's archived snapshot from the
   * audit log (the `feature_flag.deleted` entry with `archivedSnapshot`),
   * re-creating the `universe_feature_flags` row exactly as it was before
   * deletion and re-publishing it to the runtime Redis store. Mirrors the
   * global flags' undo path. The snapshot's `archivedAt` stamp is dropped (it
   * belongs to the deletion, not the flag). Refuses to clobber a flag that
   * already exists, and reports a clean miss when no archive exists.
   */
  async restoreUniverseFlag(
    universeId: string,
    featureKey: string,
    actorId?: string
  ): Promise<{ key: string; restored: boolean; reason?: string; enabled?: boolean }> {
    const key = `${universeId}.${featureKey}`;
    const existing = await this.prisma.universeFeatureFlag.findUnique({
      where: { universeId_featureKey: { universeId, featureKey } },
    });
    if (existing) {
      return { key, restored: false, reason: 'already-exists' };
    }

    // Newest-first delete entries; the most recent archive for this key wins.
    const result = await this.auditService.getLogs(
      { action: 'feature_flag.deleted', targetType: 'universe_feature_flag' },
      1,
      200
    );
    const deletedLog = result.logs.find((log) => {
      const entry = log as Record<string, unknown>;
      const details = (entry.details as Record<string, unknown> | undefined) ?? {};
      const snapshot = details.archivedSnapshot as Record<string, unknown> | undefined;
      return snapshot?.universeId === universeId && snapshot?.featureKey === featureKey;
    }) as (Record<string, unknown> & { details?: Record<string, unknown> }) | undefined;
    const snapshot = deletedLog?.details?.archivedSnapshot as Record<string, unknown> | undefined;
    if (!snapshot) {
      return { key, restored: false, reason: 'no-archive' };
    }

    const isEnabled = snapshot.isEnabled === true;
    const metadata = (snapshot.metadata ?? null) as InputJsonValue | null;
    try {
      await this.prisma.universeFeatureFlag.create({
        data: {
          universeId,
          featureKey,
          isEnabled,
          metadata: metadata ?? undefined,
        },
      });
    } catch (error) {
      // Double-restore race: between our findUnique and create, a concurrent
      // request won the unique constraint (universeId_featureKey) and created
      // the row. The constraint already guards the write; surface the outcome
      // as a clean already-exists instead of a 500. The winner owns the audit
      // entry + Redis publish, so this request must NOT write a duplicate.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        this.logger.warn(
          `Restore of universe flag ${key} lost the create race (unique constraint P2002) — already exists`
        );
        return { key, restored: false, reason: 'already-exists' };
      }
      throw error;
    }

    const universe = await this.prisma.universe.findUnique({
      where: { id: universeId },
      select: { name: true },
    });
    if (universe) {
      await this.publishFlagToRedis(
        universe.name,
        featureKey,
        isEnabled,
        (snapshot.metadata ?? null) as Record<string, unknown> | null
      );
    }

    await this.auditService.log({
      actorId,
      actorType: 'admin',
      action: 'feature_flag.restored',
      targetType: 'universe_feature_flag',
      targetId: `${universe?.name ?? universeId}.${featureKey}`,
      details: {
        restoredFromSnapshotAt: snapshot.archivedAt,
        restoredAt: new Date().toISOString(),
      },
    });

    this.logger.log(
      `Universe feature flag ${universe?.name ?? universeId}.${featureKey} restored by ${actorId ?? 'unknown'}`
    );
    return { key, restored: true as const, enabled: isEnabled };
  }

  /** Batch undo: restores several pruned universe flags from their archived snapshots. */
  async restoreManyUniverseFlags(
    keys: Array<{ universeId: string; featureKey: string }>,
    actorId?: string
  ) {
    const restored: Array<{ key: string; enabled?: boolean }> = [];
    const skipped: Array<{ key: string; reason: string }> = [];
    for (const k of keys) {
      const res = await this.restoreUniverseFlag(k.universeId, k.featureKey, actorId);
      if (res.restored) {
        restored.push({ key: res.key, enabled: res.enabled });
      } else {
        skipped.push({ key: res.key, reason: res.reason ?? 'unknown' });
      }
    }
    return {
      success: true,
      data: { restoredCount: restored.length, restored, skipped },
    };
  }

  /**
   * Recently removed universe flags (undo list): newest-first
   * `feature_flag.deleted` audit entries for `universe_feature_flag`, mapped
   * to restorable rows. `archived` is true only when the entry carries an
   * `archivedSnapshot` (the archive-before-remove contract guarantees it for
   * prune/remove paths); unarchived entries render as not-restorable. Mirrors
   * the global flags' `getRecentlyDeleted`.
   */
  async getRecentlyDeletedUniverseFlags(limit = 20) {
    const { logs } = await this.auditService.getLogs(
      { action: 'feature_flag.deleted', targetType: 'universe_feature_flag' },
      1,
      limit
    );
    return logs.map((log) => {
      const entry = log as Record<string, unknown>;
      const details = (entry.details as Record<string, unknown> | undefined) ?? {};
      const snapshot = details.archivedSnapshot as Record<string, unknown> | undefined;
      return {
        key: entry.targetId,
        universeId: typeof snapshot?.universeId === 'string' ? snapshot.universeId : undefined,
        featureKey: typeof snapshot?.featureKey === 'string' ? snapshot.featureKey : undefined,
        universeName:
          typeof snapshot?.universeName === 'string' ? snapshot.universeName : undefined,
        deletedAt: entry.createdAt,
        deletedBy: entry.actorId,
        archived: Boolean(snapshot),
        enabled: typeof snapshot?.isEnabled === 'boolean' ? snapshot.isEnabled : undefined,
      };
    });
  }

  /**
   * Sweep bookkeeping for universe flags: merges `staleNotifiedAt` into the
   * flag's `metadata` (DB-only — the runtime Redis payload is unchanged; the
   * stamp drives sweep dedupe + the admin UI's 'stale · notified' badge).
   */
  async stampStaleNotifiedAt(
    universeId: string,
    featureKey: string,
    notifiedAt: string
  ): Promise<unknown> {
    const existing = await this.prisma.universeFeatureFlag.findUnique({
      where: { universeId_featureKey: { universeId, featureKey } },
    });
    if (!existing) return null;
    const metadata = (existing.metadata ?? {}) as Record<string, unknown>;
    return this.prisma.universeFeatureFlag.update({
      where: { universeId_featureKey: { universeId, featureKey } },
      data: {
        metadata: { ...metadata, staleNotifiedAt: notifiedAt } as InputJsonValue,
      },
    });
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
        select: { id: true, isEnabled: true },
      });

      if (!universe || !universe.isEnabled) {
        return false;
      }

      // The regenerated client exposes the (universeId, featureKey) compound
      // unique finder — use it directly instead of fetching the universe's
      // featureFlags relation and taking `[0]`.
      const flag = await this.prisma.universeFeatureFlag.findUnique({
        where: { universeId_featureKey: { universeId: universe.id, featureKey } },
      });
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
