import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CacheService } from './cache.service';

export interface WarmupConfig {
  key: string;
  fetchFn: () => Promise<unknown>;
  ttl: number;
  tags?: string[];
}

@Injectable()
export class CacheWarmerService implements OnModuleInit {
  private readonly logger = new Logger(CacheWarmerService.name);
  private warmupConfigs: WarmupConfig[] = [];

  constructor(private cacheService: CacheService) {}

  async onModuleInit() {
    this.registerWarmupTasks();
    await this.warmAll();
  }

  /**
   * Register all warmup tasks
   */
  private registerWarmupTasks() {
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
   * Warm all caches on startup
   */
  async warmAll(): Promise<void> {
    this.logger.log('Starting cache warmup...');
    const startTime = Date.now();

    const results = await Promise.allSettled(
      this.warmupConfigs.map((config) => this.warmSingle(config))
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    const duration = Date.now() - startTime;

    this.logger.log(
      `Cache warmup completed: ${succeeded} succeeded, ${failed} failed in ${duration}ms`
    );
  }

  /**
   * Warm a single cache entry
   */
  async warmSingle(config: WarmupConfig): Promise<void> {
    try {
      const data = await config.fetchFn();
      await this.cacheService.set(config.key, data, {
        ttl: config.ttl,
        tags: config.tags,
      });
      this.logger.debug(`Warmed cache: ${config.key}`);
    } catch (error) {
      this.logger.error(`Failed to warm cache: ${config.key}`, error);
    }
  }

  /**
   * Warm cache by tag
   */
  async warmByTag(tag: string): Promise<void> {
    const configs = this.warmupConfigs.filter((c) => c.tags?.includes(tag));
    this.logger.log(`Warming ${configs.length} caches with tag: ${tag}`);

    await Promise.allSettled(configs.map((config) => this.warmSingle(config)));
  }

  /**
   * Scheduled warmup - runs every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async scheduledWarmup() {
    this.logger.debug('Running scheduled cache warmup');
    await this.warmAll();
  }

  /**
   * Get warmup status
   */
  getStatus(): { totalConfigs: number; lastWarmup: Date } {
    return {
      totalConfigs: this.warmupConfigs.length,
      lastWarmup: new Date(),
    };
  }

  // --- Data fetching functions (stubs) ---

  private async fetchTrending(universe: string): Promise<unknown> {
    // In production, query database
    return { universe, items: [], updatedAt: new Date() };
  }

  private async fetchPopularByRegion(region: string): Promise<unknown> {
    return { region, items: [], updatedAt: new Date() };
  }

  private async fetchNewReleases(): Promise<unknown> {
    return { items: [], updatedAt: new Date() };
  }

  private async fetchAllCategories(): Promise<unknown> {
    return { categories: [], updatedAt: new Date() };
  }

  private async fetchFeaturedCreators(): Promise<unknown> {
    return { creators: [], updatedAt: new Date() };
  }

  private async fetchFeatureFlags(): Promise<unknown> {
    return { flags: {}, updatedAt: new Date() };
  }
}
