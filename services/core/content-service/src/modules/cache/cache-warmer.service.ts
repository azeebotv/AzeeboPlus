import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CacheService } from './cache.service.js';
import { PrismaService } from '../database/prisma.service.js';

export interface WarmupConfig {
  key: string;
  fetchFn: () => Promise<unknown>;
  ttl: number;
  tags?: string[];
}

export interface WarmupOutcome {
  success: boolean;
  key: string;
  error?: string;
}

export interface CacheWarmerStatus {
  totalConfigs: number;
  lastAttemptAt: Date | null;
  lastSuccessAt: Date | null;
  lastDurationMs: number | null;
  failedKeys: string[];
  succeededKeys: string[];
  isHealthy: boolean;
}

@Injectable()
export class CacheWarmerService implements OnModuleInit {
  private readonly logger = new Logger(CacheWarmerService.name);
  private warmupConfigs: WarmupConfig[] = [];

  private lastAttemptAt: Date | null = null;
  private lastSuccessAt: Date | null = null;
  private lastDurationMs: number | null = null;
  private lastFailedKeys: string[] = [];
  private lastSucceededKeys: string[] = [];

  constructor(
    private readonly cacheService: CacheService,
    @Optional() private readonly prisma?: PrismaService
  ) {}

  async onModuleInit(): Promise<void> {
    this.registerWarmupTasks();
    await this.warmAll();
  }

  /**
   * Register all warmup tasks
   */
  private registerWarmupTasks(): void {
    this.warmupConfigs = [
      // Trending content - refresh every 5 minutes
      {
        key: 'trending:movies',
        fetchFn: () => this.fetchTrending('movies'),
        ttl: 300,
        tags: ['content', 'trending'],
      },
      {
        key: 'trending:music',
        fetchFn: () => this.fetchTrending('music'),
        ttl: 300,
        tags: ['content', 'trending'],
      },
      {
        key: 'trending:comedy',
        fetchFn: () => this.fetchTrending('comedy'),
        ttl: 300,
        tags: ['content', 'trending'],
      },
      {
        key: 'trending:reality',
        fetchFn: () => this.fetchTrending('reality'),
        ttl: 300,
        tags: ['content', 'trending'],
      },
      {
        key: 'trending:sports',
        fetchFn: () => this.fetchTrending('sports'),
        ttl: 300,
        tags: ['content', 'trending'],
      },

      // Popular content - refresh every 10 minutes
      {
        key: 'popular:region:lagos',
        fetchFn: () => this.fetchPopularByRegion('lagos'),
        ttl: 600,
        tags: ['content', 'popular'],
      },
      {
        key: 'popular:region:abuja',
        fetchFn: () => this.fetchPopularByRegion('abuja'),
        ttl: 600,
        tags: ['content', 'popular'],
      },

      // New releases - refresh every 15 minutes
      {
        key: 'new-releases',
        fetchFn: () => this.fetchNewReleases(),
        ttl: 900,
        tags: ['content', 'new'],
      },

      // Categories - refresh every 30 minutes
      {
        key: 'categories:all',
        fetchFn: () => this.fetchAllCategories(),
        ttl: 1800,
        tags: ['categories'],
      },

      // Creator profiles - refresh every 20 minutes
      {
        key: 'creators:featured',
        fetchFn: () => this.fetchFeaturedCreators(),
        ttl: 1200,
        tags: ['creators'],
      },

      // Feature flags - refresh every 5 minutes
      {
        key: 'feature-flags:all',
        fetchFn: () => this.fetchFeatureFlags(),
        ttl: 300,
        tags: ['config'],
      },
    ];
  }

  /**
   * Warm all caches on startup or on schedule
   */
  async warmAll(): Promise<{ succeeded: number; failed: number; durationMs: number }> {
    this.logger.log('Starting cache warmup...');
    const startTime = Date.now();
    this.lastAttemptAt = new Date(startTime);

    const outcomes: WarmupOutcome[] = await Promise.all(
      this.warmupConfigs.map((config) => this.warmSingle(config))
    );

    const succeededItems = outcomes.filter((o) => o.success);
    const failedItems = outcomes.filter((o) => !o.success);

    this.lastSucceededKeys = succeededItems.map((o) => o.key);
    this.lastFailedKeys = failedItems.map((o) => o.key);

    const duration = Date.now() - startTime;
    this.lastDurationMs = duration;

    if (failedItems.length === 0) {
      this.lastSuccessAt = new Date();
    }

    this.logger.log(
      `Cache warmup completed: ${succeededItems.length} succeeded, ${failedItems.length} failed in ${duration}ms`
    );

    return {
      succeeded: succeededItems.length,
      failed: failedItems.length,
      durationMs: duration,
    };
  }

  /**
   * Warm a single cache entry without swallowing errors silently
   */
  async warmSingle(config: WarmupConfig): Promise<WarmupOutcome> {
    try {
      const data = await config.fetchFn();
      await this.cacheService.set(config.key, data, {
        ttl: config.ttl,
        tags: config.tags,
      });
      this.logger.debug(`Warmed cache: ${config.key}`);
      return { success: true, key: config.key };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to warm cache: ${config.key}`, error);
      return { success: false, key: config.key, error: errMsg };
    }
  }

  /**
   * Warm cache by tag
   */
  async warmByTag(tag: string): Promise<WarmupOutcome[]> {
    const configs = this.warmupConfigs.filter((c) => c.tags?.includes(tag));
    this.logger.log(`Warming ${configs.length} caches with tag: ${tag}`);

    return Promise.all(configs.map((config) => this.warmSingle(config)));
  }

  /**
   * Scheduled warmup - runs every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async scheduledWarmup(): Promise<void> {
    this.logger.debug('Running scheduled cache warmup');
    await this.warmAll();
  }

  /**
   * Get truthful warmup status (never returns current timestamp if no warmup occurred)
   */
  getStatus(): CacheWarmerStatus {
    return {
      totalConfigs: this.warmupConfigs.length,
      lastAttemptAt: this.lastAttemptAt,
      lastSuccessAt: this.lastSuccessAt,
      lastDurationMs: this.lastDurationMs,
      failedKeys: [...this.lastFailedKeys],
      succeededKeys: [...this.lastSucceededKeys],
      isHealthy: this.lastFailedKeys.length === 0 && this.lastAttemptAt !== null,
    };
  }

  // --- Authoritative Data Fetching (backed by PrismaService when available) ---

  private async fetchTrending(universe: string): Promise<unknown> {
    if (this.prisma) {
      const items = await this.prisma.contentItem.findMany({
        where: {
          status: 'published',
          universe: { name: universe },
        },
        orderBy: [{ viewCount: 'desc' }, { createdAt: 'desc' }],
        take: 20,
        select: {
          id: true,
          title: true,
          thumbnail: true,
          universeId: true,
          viewCount: true,
          publishedAt: true,
        },
      });
      return { universe, items, updatedAt: new Date() };
    }
    return { universe, items: [], updatedAt: new Date() };
  }

  private async fetchPopularByRegion(region: string): Promise<unknown> {
    if (this.prisma) {
      const items = await this.prisma.contentItem.findMany({
        where: { status: 'published' },
        orderBy: [{ viewCount: 'desc' }, { createdAt: 'desc' }],
        take: 20,
        select: {
          id: true,
          title: true,
          thumbnail: true,
          universeId: true,
          viewCount: true,
        },
      });
      return { region, items, updatedAt: new Date() };
    }
    return { region, items: [], updatedAt: new Date() };
  }

  private async fetchNewReleases(): Promise<unknown> {
    if (this.prisma) {
      const items = await this.prisma.contentItem.findMany({
        where: { status: 'published' },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          title: true,
          thumbnail: true,
          universeId: true,
          createdAt: true,
        },
      });
      return { items, updatedAt: new Date() };
    }
    return { items: [], updatedAt: new Date() };
  }

  private async fetchAllCategories(): Promise<unknown> {
    if (this.prisma) {
      const categories = await this.prisma.category.findMany({
        take: 50,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
        },
      });
      return { categories, updatedAt: new Date() };
    }
    return { categories: [], updatedAt: new Date() };
  }

  private async fetchFeaturedCreators(): Promise<unknown> {
    if (this.prisma) {
      const creators = await this.prisma.contentItem.findMany({
        where: { status: 'published' },
        distinct: ['creatorId'],
        take: 20,
        select: {
          creatorId: true,
        },
      });
      return { creators, updatedAt: new Date() };
    }
    return { creators: [], updatedAt: new Date() };
  }

  private async fetchFeatureFlags(): Promise<unknown> {
    if (this.prisma) {
      const flags = await this.prisma.universeFeatureFlag.findMany({
        take: 100,
      });
      return { flags, updatedAt: new Date() };
    }
    return { flags: {}, updatedAt: new Date() };
  }
}
