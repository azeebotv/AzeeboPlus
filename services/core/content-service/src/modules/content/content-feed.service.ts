import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '../../prisma/client/index.js';
import { RedisService } from '../../cache/redis.service.js';
import { ConfigService } from '@nestjs/config';
import { FeatureFlagService, contentFlags, universeFlagKey } from '@azeebo/feature-flags';

type ContentWithUniverse = Prisma.ContentItemGetPayload<{ include: { universe: true } }>;

@Injectable()
export class ContentFeedService {
  private readonly logger = new Logger(ContentFeedService.name);
  private readonly cacheTTL: number;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(RedisService) private readonly redisService: RedisService,
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(FeatureFlagService) private readonly featureFlagService: FeatureFlagService
  ) {
    this.cacheTTL = this.configService.get<number>('CONTENT_CACHE_TTL', 300);
  }

  /**
   * Per-universe flag bridge: returns the ids of universes that may surface in
   * discovery feeds for the given feature key. A universe is enabled when it
   * has no explicitly-disabled row for the key (default true) or its row is
   * explicitly enabled.
   *
   * Source of truth: the admin app publishes universe toggles to the runtime
   * flag store (`feature_flags:universe.<name>.<feature>`, see
   * `universeFlagKey`), so this consults that Redis store FIRST via
   * FeatureFlagService — admin toggles then gate discovery feeds within the
   * flag cache TTL. The local `UniverseFeatureFlag` table is the historical
   * content-service copy and remains a fallback when the Redis store has no
   * row for the key (default-enabled), which also makes the two stores
   * converge instead of diverging on admin edits. Cached 5 minutes.
   *
   * Also ANDs in the universe VISIBILITY sentinel
   * (`universe.<name>.enabled`, the admin enable/disable toggle): a disabled
   * universe must not surface in ANY feed. Both lookups share ONE batched
   * Redis MGET (FeatureFlagService.getFlags), and the result rides the same
   * 5-minute store cache as before — so hot feed paths cost at most one extra
   * Redis read per universe per TTL window, not per request.
   */
  async getEnabledUniverseIds(featureKey: string): Promise<string[]> {
    return this.enabledUniverseIds(featureKey, true);
  }

  /** Universe ids gated ONLY by the visibility sentinel (no per-feature
   * bridge) — for surfaces that list universes rather than feed content,
   * e.g. GET /public/universes consumed by web/mobile/creator pickers. */
  async getVisibleUniverseIds(): Promise<string[]> {
    return this.enabledUniverseIds('enabled', false);
  }

  private async enabledUniverseIds(featureKey: string, withBridge: boolean): Promise<string[]> {
    const cacheKey = `universe-features:${featureKey}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as string[];
    }

    // All universes (with names, needed for the Redis key convention), then
    // filter by the bridge: Redis flag present + disabled → excluded;
    // otherwise default-enabled.
    const universes = await this.prisma.universe.findMany({
      select: { id: true, name: true },
    });

    const featureKeys: string[] = [];
    for (const universe of universes) {
      if (withBridge) {
        featureKeys.push(universeFlagKey(universe.name, featureKey));
      }
      // Visibility sentinel — the admin universe enable/disable toggle.
      featureKeys.push(universeFlagKey(universe.name, 'enabled'));
    }
    const flags = await this.featureFlagService.getFlags(featureKeys);

    const isOff = (key: string): boolean => {
      const flag = flags.get(key);
      return flag !== undefined && flag.enabled === false;
    };

    const ids: string[] = [];
    for (const universe of universes) {
      if (withBridge && isOff(universeFlagKey(universe.name, featureKey))) continue; // explicitly disabled
      if (isOff(universeFlagKey(universe.name, 'enabled'))) continue; // universe hidden
      ids.push(universe.id);
    }

    await this.redisService.set(cacheKey, JSON.stringify(ids), this.cacheTTL);
    return ids;
  }

  /** where-clause fragment that limits results to discovery-enabled universes. */
  async discoveryUniverseFilter(): Promise<Record<string, unknown>> {
    const ids = await this.getEnabledUniverseIds('discovery_enabled');
    return { universeId: { in: ids } };
  }

  async getHomeFeed(userId?: string): Promise<{
    success: boolean;
    data: {
      trending: ContentWithUniverse[];
      recommended: ContentWithUniverse[];
      latest: ContentWithUniverse[];
    };
  }> {
    const cacheKey = `home-feed:${userId || 'anonymous'}`;

    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const contentSelect = {
      id: true,
      title: true,
      description: true,
      thumbnail: true,
      windowType: true,
      status: true,
      viewCount: true,
      createdAt: true,
      universe: {
        select: {
          id: true,
          name: true,
          displayName: true,
        },
      },
    };

    const watchedContentIds = userId
      ? (
          await this.prisma.watchHistory.findMany({
            where: { userId },
            select: { contentId: true },
          })
        ).map((h) => h.contentId)
      : [];

    const [enabledUniverseFilter, recommendedRailOn] = await Promise.all([
      this.discoveryUniverseFilter(),
      this.featureFlagService.isEnabled(contentFlags.recommendedRail),
    ]);

    const baseWhere = { status: 'published', ...enabledUniverseFilter };

    const [trending, recommended, latest] = await Promise.all([
      this.prisma.contentItem.findMany({
        where: baseWhere,
        select: contentSelect,
        orderBy: { viewCount: 'desc' },
        take: 10,
      }),
      recommendedRailOn && userId
        ? this.prisma.contentItem.findMany({
            where: {
              ...baseWhere,
              id: { notIn: watchedContentIds },
            },
            select: contentSelect,
            orderBy: { viewCount: 'desc' },
            take: 10,
          })
        : [],
      this.prisma.contentItem.findMany({
        where: baseWhere,
        select: contentSelect,
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    const result = {
      success: true,
      data: {
        trending: trending as unknown as ContentWithUniverse[],
        recommended: recommended as unknown as ContentWithUniverse[],
        latest: latest as unknown as ContentWithUniverse[],
      },
    };

    await this.redisService.set(cacheKey, JSON.stringify(result), this.cacheTTL);

    return result;
  }

  async getWatchFeed(userId?: string): Promise<{ success: boolean; data: ContentWithUniverse[] }> {
    const where: Record<string, unknown> = {
      status: 'published',
      ...(await this.discoveryUniverseFilter()),
    };

    if (userId) {
      const watchedIds = await this.prisma.watchHistory.findMany({
        where: { userId },
        select: { contentId: true },
        orderBy: { watchedAt: 'desc' },
        take: 100,
      });
      const excludeIds = watchedIds.map((w) => w.contentId);
      if (excludeIds.length > 0) {
        where.id = { notIn: excludeIds };
      }
    }

    const content = await this.prisma.contentItem.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        status: true,
        viewCount: true,
        createdAt: true,
        universe: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
      },
      orderBy: { viewCount: 'desc' },
      take: 50,
    });

    return {
      success: true,
      data: content as ContentWithUniverse[],
    };
  }

  async getFeatured(): Promise<{
    success: boolean;
    data: ContentWithUniverse[];
    error?: { code: string; message: string };
  }> {
    try {
      const enabledUniverseFilter = await this.discoveryUniverseFilter();
      const content = await this.prisma.contentItem.findMany({
        where: {
          status: 'published',
          ...enabledUniverseFilter,
          OR: [{ isExclusive: true }, { isPremiere: true }],
        },
        orderBy: { viewCount: 'desc' },
        take: 20,
        include: { universe: true },
      });

      if (content.length === 0) {
        const fallback = await this.prisma.contentItem.findMany({
          where: { status: 'published', ...enabledUniverseFilter },
          orderBy: { viewCount: 'desc' },
          take: 6,
          include: { universe: true },
        });
        return { success: true, data: fallback };
      }

      return { success: true, data: content };
    } catch (error) {
      this.logger.error(`getFeatured failed: ${(error as Error).message}`);
      return {
        success: false,
        data: [],
        error: { code: 'FEED_ERROR', message: 'Failed to fetch featured content' },
      };
    }
  }

  async getTrending(): Promise<{ success: boolean; data: ContentWithUniverse[] }> {
    try {
      const content = await this.prisma.contentItem.findMany({
        where: { status: 'published', ...(await this.discoveryUniverseFilter()) },
        orderBy: { viewCount: 'desc' },
        take: 20,
        include: { universe: true },
      });

      return {
        success: true,
        data: content,
      };
    } catch (error) {
      this.logger.error(`getTrending failed: ${(error as Error).message}`);
      return {
        success: true,
        data: [],
      };
    }
  }

  async getNewReleases(limit?: number): Promise<{
    success: boolean;
    data: ContentWithUniverse[];
    error?: { code: string; message: string };
  }> {
    try {
      const take = Math.min(limit || 12, 50);
      const content = await this.prisma.contentItem.findMany({
        where: {
          status: 'published',
          ...(await this.discoveryUniverseFilter()),
          releaseDate: { not: null },
        },
        orderBy: { releaseDate: 'desc' },
        take,
        include: { universe: true },
      });

      return { success: true, data: content };
    } catch (error) {
      this.logger.error(`getNewReleases failed: ${(error as Error).message}`);
      return {
        success: false,
        data: [],
        error: { code: 'FEED_ERROR', message: 'Failed to fetch new releases' },
      };
    }
  }

  async getFeaturedSlides(limit?: number): Promise<{
    success: boolean;
    data: ContentWithUniverse[];
    error?: { code: string; message: string };
  }> {
    try {
      const take = Math.min(limit || 5, 10);
      const enabledUniverseFilter = await this.discoveryUniverseFilter();
      const content = await this.prisma.contentItem.findMany({
        where: {
          status: 'published',
          ...enabledUniverseFilter,
          OR: [{ isExclusive: true }, { isPremiere: true }],
        },
        orderBy: { viewCount: 'desc' },
        take,
        include: { universe: true },
      });

      if (content.length === 0) {
        const fallback = await this.prisma.contentItem.findMany({
          where: { status: 'published', ...enabledUniverseFilter },
          orderBy: { viewCount: 'desc' },
          take,
          include: { universe: true },
        });
        return { success: true, data: fallback };
      }

      return { success: true, data: content };
    } catch (error) {
      this.logger.error(`getFeaturedSlides failed: ${(error as Error).message}`);
      return {
        success: false,
        data: [],
        error: { code: 'FEED_ERROR', message: 'Failed to fetch featured slides' },
      };
    }
  }

  async getPopularInRegion(limit?: number): Promise<{
    success: boolean;
    data: ContentWithUniverse[];
    error?: { code: string; message: string };
  }> {
    try {
      const take = Math.min(limit || 12, 50);
      const content = await this.prisma.contentItem.findMany({
        where: { status: 'published', ...(await this.discoveryUniverseFilter()) },
        orderBy: { viewCount: 'desc' },
        take,
        include: { universe: true },
      });

      return { success: true, data: content };
    } catch (error) {
      this.logger.error(`getPopularInRegion failed: ${(error as Error).message}`);
      return {
        success: false,
        data: [],
        error: { code: 'FEED_ERROR', message: 'Failed to fetch popular content' },
      };
    }
  }

  async getRecommended(userId: string): Promise<{ success: boolean; data: ContentWithUniverse[] }> {
    // content_recommended_rail: the rail is empty while the flag is off.
    if (!(await this.featureFlagService.isEnabled(contentFlags.recommendedRail))) {
      return { success: true, data: [] };
    }

    const watchedContent = await this.prisma.watchHistory.findMany({
      where: { userId },
      take: 100,
      orderBy: { watchedAt: 'desc' },
    });

    const watchedContentIds = watchedContent.map((h) => h.contentId);

    const watchedContentItems = await this.prisma.contentItem.findMany({
      where: { id: { in: watchedContentIds } },
      select: { id: true, universeId: true },
    });

    const watchedUniverseIds = watchedContentItems.map((c) => c.universeId).filter((id) => id);

    const content = await this.prisma.contentItem.findMany({
      where: {
        status: 'published',
        universeId: { in: watchedUniverseIds.length ? watchedUniverseIds : undefined },
        ...(await this.discoveryUniverseFilter()),
        id: {
          notIn: watchedContentIds,
        },
      },
      orderBy: { viewCount: 'desc' },
      take: 20,
      include: { universe: true },
    });

    return {
      success: true,
      data: content,
    };
  }
}
