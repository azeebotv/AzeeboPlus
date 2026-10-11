import { Inject, Injectable, Logger, OnModuleInit, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mapAndThrow } from '@azeebo/security';
import { PrismaService } from '../database/prisma.service.js';
import { CacheService, cacheKey } from '@azeebo/shared-services';
import { FeatureFlagService, searchFlags } from '@azeebo/feature-flags';
import { MetricsService } from '../metrics/metrics.service.js';
import axios from 'axios';
// Prisma client types available via PrismaService
import { Prisma, type SearchTypoCorrection } from '../../prisma/client/index.js';
import { SearchResponse } from './interfaces/search-response.interface.js';
import {
  scoreFuzzyCandidate,
  DEFAULT_TRIGRAM_WEIGHT,
  DECISIVE_MATCH_SCORE,
  FUZZY_MATCH_THRESHOLD,
} from './fuzzy.js';

/** Ops-facing view of the pg_trgm guard (see /health). */
export interface FuzzyStatus {
  /** search_typo_tolerance flag state. */
  enabled: boolean;
  /** Last known pg_trgm availability: 'unknown' = probe failed / never ran. */
  pgTrgm: 'available' | 'missing' | 'unknown';
  /** Last known presence of the migration's GIN trigram indexes: the
   * extension can exist without them (unindexed, but functional). */
  indexes: 'present' | 'missing' | 'unknown';
  /** true when the flag wants fuzzy search but pg_trgm can't serve it. */
  degraded: boolean;
  /** Human-readable note explaining degradation or the missing-index
   * condition; absent when everything is healthy. */
  warning?: string;
  /** Effective search mode the service actually runs in. */
  mode: 'fuzzy' | 'exact';
  /** ISO timestamp of the last availability probe (null = never). */
  lastProbeAt: string | null;
}

interface FacetedFilters {
  universe?: string;
  /** Category NAMES — the search index stores denormalized names (the
   * content_categories relation resolved to categories.name). */
  categories?: string[];
  tags?: string[];
  contentType?: string[];
  dateRange?: { start?: string; end?: string };
  rating?: { min?: number; max?: number };
  sort?: string;
  page?: number;
  limit?: number;
  /** Per-surface pagination: page/limit for creators and universes, whose
   * totals are exact since the counts run over the same predicate. */
  creatorsPage?: number;
  creatorsLimit?: number;
  universesPage?: number;
  universesLimit?: number;
}

interface Facet {
  id: string;
  name: string;
  count: number;
}

/** Row shapes returned by the pg_trgm candidate retrieval queries. The
 * `*Sim` fields carry the per-column pg_trgm similarity() the query SELECTs —
 * the explainable n-gram signal blended into the reported relevance score. */
interface FuzzyContentRow {
  id: string;
  title: string;
  description: string | null;
  status: string;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  contentType?: string;
  universe?: string;
  thumbnail?: string;
  duration?: number;
  categories?: string[];
  creatorName?: string | null;
  titleSim?: number | null;
  descSim?: number | null;
}

interface FuzzyCreatorRow {
  id: string;
  userId: string;
  displayName: string | null;
  bio: string | null;
  displayNameSim?: number | null;
  bioSim?: number | null;
  email: string | null;
}

interface FuzzyUniverseRow {
  id: string;
  name: string;
  displayName: string | null;
  nameSim?: number | null;
  displayNameSim?: number | null;
}

interface Facets {
  universes: Facet[];
  categories: Facet[];
  tags: Facet[];
  contentTypes: Facet[];
  dateRanges: Facet[];
}

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private readonly analyticsServiceBaseUrl: string;

  // pg_trgm availability guard (see prisma/migrations/…_pg_trgm_fuzzy_search):
  // the fuzzy path's $queryRaw depends on the extension, which must exist in
  // the search-service DB (and may require an admin to CREATE EXTENSION if the
  // role lacks that grant). We probe at startup; if it's missing — or the probe
  // is inconclusive (DB down at boot) — search() degrades to the exact path
  // and warns instead of 400ing every fuzzy request. The state is re-checked
  // lazily (throttled) so a flapping DB heals without a restart. The probe also
  // verifies the GIN trigram indexes from the migration actually exist: the
  // extension alone leaves similarity() running on seq scans (correct, but
  // unindexed), so that combination warns without degrading.
  private pgTrgmAvailable: boolean | null = null;
  private pgTrgmIndexesPresent: boolean | null = null;
  private pgTrgmProbeInFlight: Promise<{
    available: boolean | null;
    indexesPresent: boolean | null;
  }> | null = null;
  private pgTrgmLastProbeMs = 0;
  private pgTrgmWarned = false;
  private pgTrgmIndexesWarned = false;
  private readonly suggestionsAiUrl?: string;
  private static readonly PG_TRGM_REPROBE_INTERVAL_MS = 60_000;
  // The GIN trigram indexes created by the pg_trgm migration (one per
  // searchable column). All six must exist for index-backed retrieval.
  // NOTE: the migration (and the index-repair job) write these names WITHOUT
  // quoting, so PostgreSQL folds the mixed-case ones to lowercase — the probe
  // must match what pg_indexes actually stores, not the DDL's source text.
  private static readonly TRGM_INDEX_NAMES = [
    'content_items_title_trgm_idx',
    'content_items_description_trgm_idx',
    'creator_profiles_displayname_trgm_idx',
    'creator_profiles_bio_trgm_idx',
    'universes_name_trgm_idx',
    'universes_displayname_trgm_idx',
  ];

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CacheService) private readonly cache: CacheService,
    @Inject(FeatureFlagService) private readonly featureFlagService: FeatureFlagService,
    private readonly configService: ConfigService,
    @Inject(MetricsService) private readonly metricsService: MetricsService
  ) {
    this.analyticsServiceBaseUrl = this.configService.get<string>(
      'ANALYTICS_SERVICE_URL',
      'http://analytics-service:3008'
    );
    this.suggestionsAiUrl = this.configService.get<string>('SEARCH_SUGGESTIONS_AI_URL');
  }

  // Fuzzy (search_typo_tolerance) candidate retrieval is computed in Postgres
  // via pg_trgm similarity() (GIN-indexed, see prisma/migrations/…_pg_trgm).
  // The LIMITs below are safety caps, not search-quality bounds — for any
  // catalog smaller than the cap the SQL pool is complete (all rows above the
  // trigram threshold), unlike the old contains/token + popular-fallback pool.
  private static readonly FUZZY_POOL_SIZE = 1000;
  private static readonly FUZZY_PERSON_POOL = 200;
  // SQL retrieval threshold: candidates above this trigram similarity enter
  // the pool, then the in-process fuzzyScore (threshold FUZZY_MATCH_THRESHOLD)
  // does final ranking. The retrieval threshold is deliberately lower (recall)
  // than the scoring threshold (precision). ILIKE substring patterns are also
  // included, so exact-substring matches always enter the pool.
  private static readonly FUZZY_SQL_SIMILARITY_THRESHOLD = 0.3;

  private async trackAnalyticsEvent(
    eventName: string,
    userId: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    try {
      await axios.post(
        `${this.analyticsServiceBaseUrl}/analytics/track`,
        { eventName, userId, metadata, timestamp: new Date().toISOString() },
        { timeout: 10000 }
      );
    } catch (error) {
      this.logger.warn(`Failed to track analytics event: ${eventName}`);
    }
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /** Runtime-tunable trigram weight for the fuzzy blend (0–1), read from the
   * search_fuzzy_trigram_weight flag. Falls back to the shipped 0.4 default
   * when unset; clamped so the blend stays valid. Changes land within the
   * flag cache TTL — no deploy, no restart. */
  private async fuzzyTrigramWeight(): Promise<number> {
    const raw = await this.featureFlagService.getValue(searchFlags.fuzzyTrigramWeight);
    const weight = typeof raw === 'number' ? raw : DEFAULT_TRIGRAM_WEIGHT;
    return Math.min(1, Math.max(0, weight));
  }

  /** Probes pg_extension AND the GIN trigram indexes once at startup.
   * Returns the availability state on success; nulls when the probe itself
   * fails (DB unreachable) — the unknown state is re-probed lazily on the next
   * fuzzy search rather than assumed available. Never throws. */
  private async probePgTrgm(): Promise<{
    available: boolean | null;
    indexesPresent: boolean | null;
  }> {
    this.pgTrgmLastProbeMs = Date.now();
    try {
      const rows = await this.prisma.$queryRaw<
        Array<{ available: boolean; indexesPresent: boolean }>
      >(Prisma.sql`
        SELECT
          EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') AS "available",
          (
            SELECT count(*) FROM pg_indexes
            WHERE schemaname = current_schema()
              AND indexname IN (${Prisma.join(SearchService.TRGM_INDEX_NAMES)})
          ) = ${SearchService.TRGM_INDEX_NAMES.length} AS "indexesPresent"
      `);
      const available = rows[0]?.available ?? false;
      const indexesPresent = rows[0]?.indexesPresent ?? false;
      if (available) {
        this.pgTrgmWarned = false;
      }
      if (indexesPresent) {
        this.pgTrgmIndexesWarned = false;
      }
      return { available, indexesPresent };
    } catch (error: unknown) {
      this.logger.warn(
        'pg_trgm availability probe failed — fuzzy search falls back to the exact path until the probe succeeds',
        error
      );
      return { available: null, indexesPresent: null };
    }
  }

  /** Warns once per episode when the extension exists but the migration's GIN
   * trigram indexes don't — fuzzy search still works, just without index
   * acceleration. */
  private warnMissingTrgmIndexes(): void {
    if (
      this.pgTrgmAvailable === true &&
      this.pgTrgmIndexesPresent === false &&
      !this.pgTrgmIndexesWarned
    ) {
      this.pgTrgmIndexesWarned = true;
      this.logger.warn(
        'pg_trgm extension is present but the GIN trigram indexes are missing — fuzzy search runs without index acceleration. Apply the pg_trgm migration (20260810000001_pg_trgm_fuzzy_search) to create the indexes.'
      );
    }
  }

  async onModuleInit(): Promise<void> {
    await this.refreshFuzzyProbe();
  }

  /** Re-run the pg_trgm probe now and refresh the metrics gauges. Public so
   * the index-repair job can flip /health + /metrics to 'present' immediately
   * after recreating missing GIN indexes. Never throws. */
  async refreshFuzzyProbe(): Promise<void> {
    const probe = await this.probePgTrgm();
    this.pgTrgmAvailable = probe.available;
    this.pgTrgmIndexesPresent = probe.indexesPresent;
    this.warnMissingTrgmIndexes();
    await this.updateFuzzyMetrics();
  }

  /** Push the latest fuzzy-guard state onto the Prometheus gauges so
   * /metrics (and alerts on search_fuzzy_degraded) track every probe. */
  private async updateFuzzyMetrics(): Promise<void> {
    try {
      this.metricsService.setFuzzyStatus(await this.getFuzzyStatus());
    } catch (error) {
      this.logger.error('Failed to update fuzzy metrics', (error as Error).stack);
    }
  }

  /** Ops-facing view of the fuzzy-search guard state (exposed via /health).
   * Read-only — never triggers a probe; the search path re-probes lazily on
   * its own throttle, so this reflects the last known state. */
  async getFuzzyStatus(): Promise<FuzzyStatus> {
    const enabled = await this.featureFlagService.isEnabled(searchFlags.typoTolerance);
    const pgTrgm =
      this.pgTrgmAvailable === null
        ? ('unknown' as const)
        : this.pgTrgmAvailable
          ? ('available' as const)
          : ('missing' as const);
    const indexes =
      this.pgTrgmIndexesPresent === null
        ? ('unknown' as const)
        : this.pgTrgmIndexesPresent
          ? ('present' as const)
          : ('missing' as const);
    // Degraded = the flag wants fuzzy search but pg_trgm can't serve it.
    const degraded = enabled && this.pgTrgmAvailable === false;
    let warning: string | undefined;
    if (degraded) {
      warning =
        'search_typo_tolerance is enabled but pg_trgm is missing — falling back to the exact path';
    } else if (this.pgTrgmAvailable === true && this.pgTrgmIndexesPresent === false) {
      warning =
        'pg_trgm is present but the GIN trigram indexes are missing — fuzzy search runs without index acceleration';
    }
    return {
      enabled,
      pgTrgm,
      indexes,
      degraded,
      warning,
      mode: enabled && this.pgTrgmAvailable !== false ? 'fuzzy' : 'exact',
      lastProbeAt: this.pgTrgmLastProbeMs ? new Date(this.pgTrgmLastProbeMs).toISOString() : null,
    };
  }

  /** True when the fuzzy path can run (extension present). False → warn (once
   * per degradation episode) and degrade to the exact path. Unknown (probe
   * failed, e.g. DB down at boot) → optimistic fall-through. Either state is
   * re-probed on a throttle interval, so a missing extension that gets created
   * later — or a DB that was briefly down — heals without a restart.
   * Concurrent callers share a single in-flight probe. */
  private async isPgTrgmUsable(): Promise<boolean> {
    if (this.pgTrgmProbeInFlight) {
      await this.pgTrgmProbeInFlight;
    } else if (Date.now() - this.pgTrgmLastProbeMs >= SearchService.PG_TRGM_REPROBE_INTERVAL_MS) {
      this.pgTrgmProbeInFlight = this.probePgTrgm().then((result) => {
        this.pgTrgmAvailable = result.available;
        this.pgTrgmIndexesPresent = result.indexesPresent;
        this.pgTrgmProbeInFlight = null;
        // State changed on a re-probe — keep /metrics current.
        void this.updateFuzzyMetrics();
        return result;
      });
      await this.pgTrgmProbeInFlight;
    }
    this.warnMissingTrgmIndexes();
    if (this.pgTrgmAvailable === false) {
      if (!this.pgTrgmWarned) {
        this.pgTrgmWarned = true;
        this.logger.warn(
          'pg_trgm extension is not available — search_typo_tolerance is effectively disabled; search() falling back to the exact path. Run the pg_trgm migration (or have an admin CREATE EXTENSION pg_trgm).'
        );
      }
      return false;
    }
    return true;
  }

  /** Resolve per-surface pagination (creators/universes) from the filters,
   * with the same clamping convention as the content page/limit (controller
   * clamps to 100; these defaults are the pre-pagination caps 20/10). */
  private surfacePagination(filters: FacetedFilters | undefined): {
    creatorsPage: number;
    creatorsLimit: number;
    universesPage: number;
    universesLimit: number;
  } {
    return {
      creatorsPage: Math.max(1, filters?.creatorsPage || 1),
      creatorsLimit: Math.min(Math.max(1, filters?.creatorsLimit || 20), 100),
      universesPage: Math.max(1, filters?.universesPage || 1),
      universesLimit: Math.min(Math.max(1, filters?.universesLimit || 10), 100),
    };
  }

  /** True when a fuzzy-path failure is the missing-extension signature rather
   * than a transient DB error (which should still surface as a 400). */
  private isMissingPgTrgmError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return /pg_trgm|similarity/i.test(message);
  }

  async search(query: string, filters?: FacetedFilters): Promise<SearchResponse> {
    if (!query || query.length < 2) {
      throw new BadRequestException('Search query must be at least 2 characters');
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;

    // search_typo_tolerance: when enabled, route through fuzzy matching — but
    // only if pg_trgm is actually available; otherwise degrade to the exact
    // path (and warn) instead of failing every fuzzy request. The *effective*
    // mode is part of the cache key so toggling the flag or the extension
    // doesn't serve stale results across modes.
    const typoToleranceEnabled = await this.featureFlagService.isEnabled(searchFlags.typoTolerance);
    const fuzzyUsable = typoToleranceEnabled && (await this.isPgTrgmUsable());

    // Check cache
    const filterKey = JSON.stringify(filters || {});
    const cacheK = cacheKey(
      'search',
      `results:${fuzzyUsable ? 'fuzzy' : 'exact'}:${query}:${page}:${filterKey}`
    );
    const cached = await this.cache.get<SearchResponse>(cacheK);
    if (cached) return cached;

    if (fuzzyUsable) {
      return this.searchWithTypoTolerance(query, filters, page, limit, cacheK);
    }

    return this.searchWithExact(query, filters, page, limit, cacheK);
  }

  /** Exact (contains) search path — the flag-off behavior, and the fallback
   * when pg_trgm is unavailable. */
  private async searchWithExact(
    query: string,
    filters: FacetedFilters | undefined,
    page: number,
    limit: number,
    cacheK: string
  ): Promise<SearchResponse> {
    const skip = (page - 1) * limit;

    const escapedQuery = this.escapeRegex(query);

    const whereCondition: Record<string, unknown> = {
      ...this.baseFilters(filters),
      OR: [
        { title: { contains: escapedQuery, mode: 'insensitive' } },
        { description: { contains: escapedQuery, mode: 'insensitive' } },
      ],
    };

    let orderBy: {
      createdAt?: 'asc' | 'desc';
      viewCount?: 'asc' | 'desc';
      title?: 'asc' | 'desc';
    } = { createdAt: 'desc' };
    if (filters?.sort) {
      switch (filters.sort) {
        case 'newest':
          orderBy = { createdAt: 'desc' };
          break;
        case 'oldest':
          orderBy = { createdAt: 'asc' };
          break;
        case 'popular':
          orderBy = { viewCount: 'desc' };
          break;
        case 'alphabetical':
          orderBy = { title: 'asc' };
          break;
        case 'rating':
          orderBy = { viewCount: 'desc' };
          break;
      }
    }

    // Per-surface pagination: creators/universes page independently of
    // content, with exact totals (count over the same predicate).
    const { creatorsPage, creatorsLimit, universesPage, universesLimit } =
      this.surfacePagination(filters);
    const creatorsSkip = (creatorsPage - 1) * creatorsLimit;
    const universesSkip = (universesPage - 1) * universesLimit;

    try {
      const [contentItems, contentTotal, creators, creatorsTotal, universes, universesTotal] =
        await Promise.all([
          this.prisma.contentItem.findMany({
            where: whereCondition,
            skip,
            take: limit,
            orderBy,
          }),
          this.prisma.contentItem.count({ where: whereCondition }),
          this.prisma.creatorProfile.findMany({
            where: {
              bio: { contains: escapedQuery, mode: 'insensitive' },
            },
            skip: creatorsSkip,
            take: creatorsLimit,
          }),
          this.prisma.creatorProfile.count({
            where: {
              bio: { contains: escapedQuery, mode: 'insensitive' },
            },
          }),
          this.prisma.universe.findMany({
            where: {
              OR: [
                { name: { contains: escapedQuery, mode: 'insensitive' } },
                { displayName: { contains: escapedQuery, mode: 'insensitive' } },
              ],
            },
            skip: universesSkip,
            take: universesLimit,
          }),
          this.prisma.universe.count({
            where: {
              OR: [
                { name: { contains: escapedQuery, mode: 'insensitive' } },
                { displayName: { contains: escapedQuery, mode: 'insensitive' } },
              ],
            },
          }),
        ]);

      const result: SearchResponse = {
        success: true,
        data: {
          query,
          results: {
            content: contentItems.map((item) => ({
              id: item.id,
              title: item.title,
              description: item.description,
              status: item.status,
              viewCount: item.viewCount || 0,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
              contentType: item.contentType,
              universe: item.universe,
              thumbnail: item.thumbnail ?? undefined,
              duration: item.duration ?? undefined,
              categories: item.categories ?? [],
              creatorName: item.creatorName ?? undefined,
            })),
            creators: creators.map((creator) => ({
              id: creator.id,
              bio: creator.bio,
              user: {
                id: creator.userId,
                username: creator.displayName || '',
                email: creator.email || '',
              },
            })),
            universes: universes.map((uni) => ({
              id: uni.id,
              name: uni.name,
              displayName: uni.displayName,
            })),
          },
          total: contentTotal + creatorsTotal + universesTotal,
          pagination: {
            page,
            limit,
            total: contentTotal,
            totalPages: Math.ceil(contentTotal / limit),
          },
          creatorsPagination: {
            page: creatorsPage,
            limit: creatorsLimit,
            total: creatorsTotal,
            totalPages: Math.ceil(creatorsTotal / creatorsLimit),
          },
          universesPagination: {
            page: universesPage,
            limit: universesLimit,
            total: universesTotal,
            totalPages: Math.ceil(universesTotal / universesLimit),
          },
        },
      };

      await this.cache.set(cacheK, result, 600);

      this.trackAnalyticsEvent('search_performed', 'anonymous', {
        query,
        resultsCount: result.data?.pagination?.total ?? 0,
      });

      return result;
    } catch (error: unknown) {
      this.logger.error('Failed to perform search', error);
      mapAndThrow(error, 'performing search');
    }
  }

  /** Filters shared by the exact and fuzzy search paths (status + facet filters). */
  private baseFilters(filters?: FacetedFilters): Record<string, unknown> {
    return {
      status: 'published',
      ...(filters?.universe ? { universeId: filters.universe } : {}),
      ...(filters?.categories && filters.categories.length > 0
        ? {
            categories: {
              some: {
                id: {
                  in: filters.categories,
                },
              },
            },
          }
        : {}),
      ...(filters?.tags && filters.tags.length > 0
        ? {
            tags: {
              some: {
                id: {
                  in: filters.tags,
                },
              },
            },
          }
        : {}),
      ...(filters?.dateRange
        ? {
            createdAt: {
              ...(filters.dateRange.start ? { gte: new Date(filters.dateRange.start) } : {}),
              ...(filters.dateRange.end ? { lte: new Date(filters.dateRange.end) } : {}),
            },
          }
        : {}),
    };
  }

  /**
   * Typo-tolerant search (search_typo_tolerance): the candidate pool is
   * computed in Postgres via pg_trgm similarity() (GIN-indexed) + ILIKE
   * substring patterns — not a bounded in-process heuristic — then scored with
   * Levenshtein similarity and filtered to the threshold, ranked by relevance.
   * Exact substring matches still score 0.85+ and rank above near-misses.
   */
  private async searchWithTypoTolerance(
    query: string,
    filters: FacetedFilters | undefined,
    page: number,
    limit: number,
    cacheK: string
  ): Promise<SearchResponse> {
    const skip = (page - 1) * limit;

    try {
      // Runtime-tunable blend weight (search_fuzzy_trigram_weight) — fetched
      // once per search so ops can rebalance fuzzy vs trigram without a deploy.
      const trigramWeight = await this.fuzzyTrigramWeight();

      // Candidate pool (index-backed, LIMIT is only a safety cap) plus an
      // exact SQL count over the SAME trigram predicate — pagination total
      // reflects every matching row, not just the rows in the fetched pool.
      const [rows, countRows, creators, creatorsCountRows, universes, universesCountRows] =
        await Promise.all([
          this.prisma.$queryRaw<FuzzyContentRow[]>(Prisma.sql`
            SELECT ci.id, ci.title, ci.description, ci.status, ci."viewCount", ci."createdAt", ci."updatedAt",
              ci."contentType", ci.universe, ci.thumbnail, ci.duration, ci.categories, ci."creatorName",
              similarity(ci.title, ${query}) AS "titleSim",
              similarity(coalesce(ci.description, ''), ${query}) AS "descSim"
            FROM content_items ci
            WHERE ci."status" = 'published'
              ${this.fuzzyContentFiltersSql(filters)}
              AND ${this.trigramOr(Prisma.sql`ci.title`, Prisma.sql`ci.description`, query)}
            ORDER BY
              GREATEST(similarity(ci.title, ${query}), similarity(coalesce(ci.description, ''), ${query})) DESC,
              ci."viewCount" DESC
            LIMIT ${SearchService.FUZZY_POOL_SIZE}
          `),
          this.prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
            SELECT count(*)::int AS count
            FROM content_items ci
            WHERE ci."status" = 'published'
              ${this.fuzzyContentFiltersSql(filters)}
              AND ${this.trigramOr(Prisma.sql`ci.title`, Prisma.sql`ci.description`, query)}
          `),
          this.fuzzyCreators(query, trigramWeight),
          this.fuzzyCreatorsCount(query),
          this.fuzzyUniverses(query, trigramWeight),
          this.fuzzyUniversesCount(query),
        ]);

      // Exact, uncapped match count from the retrieval predicate (the 0.5
      // in-process score filter is a precision pass on top, so this is an
      // upper bound on what the page actually renders for very typo'd queries).
      // Exact, uncapped match counts for all three surfaces — the returned
      // creator/universe arrays are capped (20/10), but totals reflect every
      // row matching the trigram predicate, like the content count.
      const contentTotal = countRows[0]?.count ?? 0;
      const creatorsTotal = creatorsCountRows[0]?.count ?? 0;
      const universesTotal = universesCountRows[0]?.count ?? 0;

      const scored: Array<{
        item: FuzzyContentRow;
        score: number;
        fuzzy: number;
        trigram: number;
      }> = [];
      for (const item of rows) {
        // Shared scoring pipeline: identical match shapes score identically
        // across content/creators/universes (one comparable scale).
        const match = scoreFuzzyCandidate(
          query,
          item.title,
          item.description,
          item.titleSim,
          item.descSim,
          trigramWeight
        );
        // Precision pass stays on the Levenshtein component for every type;
        // the blended score (Levenshtein + pg_trgm similarity) drives ranking
        // and the response.
        if (match.fuzzy >= FUZZY_MATCH_THRESHOLD) {
          scored.push({
            item,
            score: match.score,
            fuzzy: match.fuzzy,
            trigram: match.trigram,
          });
        }
      }
      // Relevance first, recency as tie-break.
      scored.sort(
        (a, b) => b.score - a.score || b.item.createdAt.getTime() - a.item.createdAt.getTime()
      );

      const pageItems = scored.slice(skip, skip + limit);

      // 'Did you mean' hint: when even the best-scoring content match is a
      // typo-correction (below the decisive anchor), offer its title as a
      // one-click re-search. Computed over the full ranked pool (scored[0]),
      // not the current page, so paging never hides the true top match.
      let suggestedQuery: string | undefined;
      if (scored.length > 0 && scored[0].score < DECISIVE_MATCH_SCORE) {
        suggestedQuery = scored[0].item.title;
      }

      // Learned-correction preference (search_typo_dictionary): when users
      // have repeatedly accepted a specific 'did you mean' for this query,
      // prefer that correction over the raw best match — the dictionary makes
      // popular corrections sticky. Only consulted when a suggestion is
      // otherwise warranted (top match below the decisive anchor).
      if (suggestedQuery && (await this.featureFlagService.isEnabled(searchFlags.typoDictionary))) {
        const learned = await this.getTypoCorrections(query, 5);
        if (learned.length > 0) {
          const poolByTitle = new Map(
            scored.map((s) => [s.item.title.toLowerCase(), s.item.title])
          );
          const hit = learned.find((c) => poolByTitle.has(c.correctedQuery.toLowerCase()));
          if (hit) {
            suggestedQuery = poolByTitle.get(hit.correctedQuery.toLowerCase()) as string;
          }
        }
      }

      // Per-surface pagination: creators/universes page independently of
      // content (their pools are scored in full; totals are the exact SQL
      // counts over the same trigram predicate).
      const { creatorsPage, creatorsLimit, universesPage, universesLimit } =
        this.surfacePagination(filters);
      const creatorsSkip = (creatorsPage - 1) * creatorsLimit;
      const universesSkip = (universesPage - 1) * universesLimit;
      const pageCreators = creators.slice(creatorsSkip, creatorsSkip + creatorsLimit);
      const pageUniverses = universes.slice(universesSkip, universesSkip + universesLimit);

      const result: SearchResponse = {
        success: true,
        data: {
          query,
          ...(suggestedQuery ? { suggestedQuery } : {}),
          results: {
            content: pageItems.map(({ item, score, fuzzy, trigram }) => ({
              id: item.id,
              title: item.title,
              description: item.description,
              status: item.status,
              viewCount: item.viewCount || 0,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
              contentType: item.contentType,
              universe: item.universe,
              thumbnail: item.thumbnail ?? undefined,
              duration: item.duration ?? undefined,
              categories: item.categories ?? [],
              creatorName: item.creatorName ?? undefined,
              // Per-item fuzzy relevance (0–1) for rank badges / did-you-mean,
              // plus its two explainable components ('matched because').
              score,
              fuzzyScore: fuzzy,
              trigramScore: trigram,
            })),
            creators: pageCreators.map(({ creator, score, fuzzy, trigram }) => ({
              id: creator.id,
              bio: creator.bio,
              user: {
                id: creator.userId,
                username: creator.displayName || '',
                email: creator.email || '',
              },
              score,
              fuzzyScore: fuzzy,
              trigramScore: trigram,
            })),
            universes: pageUniverses.map(({ uni, score, fuzzy, trigram }) => ({
              id: uni.id,
              name: uni.name,
              displayName: uni.displayName,
              score,
              fuzzyScore: fuzzy,
              trigramScore: trigram,
            })),
          },
          total: contentTotal + creatorsTotal + universesTotal,
          pagination: {
            page,
            limit,
            total: contentTotal,
            totalPages: Math.ceil(contentTotal / limit),
          },
          creatorsPagination: {
            page: creatorsPage,
            limit: creatorsLimit,
            total: creatorsTotal,
            totalPages: Math.ceil(creatorsTotal / creatorsLimit),
          },
          universesPagination: {
            page: universesPage,
            limit: universesLimit,
            total: universesTotal,
            totalPages: Math.ceil(universesTotal / universesLimit),
          },
        },
      };

      await this.cache.set(cacheK, result, 600);

      this.trackAnalyticsEvent('search_performed', 'anonymous', {
        query,
        resultsCount: result.data?.pagination?.total ?? 0,
        mode: 'fuzzy',
      });

      return result;
    } catch (error: unknown) {
      // Missing-extension signature (e.g. the extension was dropped after the
      // startup probe, or the probe was optimistic and wrong): degrade instead
      // of 400ing, and serve this request via the exact path.
      if (this.isMissingPgTrgmError(error)) {
        this.logger.warn(
          'pg_trgm similarity failed at runtime — disabling the fuzzy path and falling back to exact search',
          error
        );
        this.pgTrgmAvailable = false;
        this.pgTrgmWarned = true;
        // Runtime degradation is the alerting event — reflect it immediately.
        void this.updateFuzzyMetrics();
        return this.searchWithExact(query, filters, page, limit, cacheK);
      }
      this.logger.error('Failed to perform fuzzy search', error);
      mapAndThrow(error, 'performing fuzzy search');
    }
  }

  private async fuzzyCreators(
    query: string,
    trigramWeight: number
  ): Promise<Array<{ creator: FuzzyCreatorRow; score: number; fuzzy: number; trigram: number }>> {
    const candidates = await this.prisma.$queryRaw<FuzzyCreatorRow[]>(Prisma.sql`
      SELECT c.id, c."userId", c."displayName", c.bio, c.email,
        similarity(c."displayName", ${query}) AS "displayNameSim",
        similarity(coalesce(c.bio, ''), ${query}) AS "bioSim"
      FROM creator_profiles c
      WHERE ${this.trigramOr(Prisma.sql`c."displayName"`, Prisma.sql`c.bio`, query)}
      ORDER BY
        GREATEST(similarity(c."displayName", ${query}), similarity(coalesce(c.bio, ''), ${query})) DESC
      LIMIT ${SearchService.FUZZY_PERSON_POOL}
    `);

    return candidates
      .map((creator) => {
        const match = scoreFuzzyCandidate(
          query,
          creator.displayName,
          creator.bio,
          creator.displayNameSim,
          creator.bioSim,
          trigramWeight
        );
        // Same admission rule as content: Levenshtein component >= threshold.
        return {
          creator,
          score: match.score,
          fuzzy: match.fuzzy,
          trigram: match.trigram,
        };
      })
      .filter((c) => c.fuzzy >= FUZZY_MATCH_THRESHOLD)
      .sort((a, b) => b.score - a.score);
  }

  /** Fail-open AI suggestion ranking: POST the query + candidate list to the
   * configured ranker and use the returned ordering. Any problem (no URL,
   * timeout, malformed payload) logs and returns the input order unchanged. */
  private async rankSuggestionsWithAi(query: string, candidates: string[]): Promise<string[]> {
    if (!this.suggestionsAiUrl || candidates.length === 0) {
      return candidates;
    }
    try {
      const response = await axios.post(
        `${this.suggestionsAiUrl}/rank`,
        { query, candidates },
        { timeout: 10_000 }
      );
      const ranked = Array.isArray(response.data?.suggestions)
        ? (response.data.suggestions as string[])
        : [];
      if (ranked.length === 0) {
        return candidates;
      }
      // Keep only suggestions the ranker returned that were candidates,
      // then append any it dropped so the response never shrinks.
      const candidateSet = new Set(candidates);
      return [
        ...ranked.filter((s) => candidateSet.has(s)),
        ...candidates.filter((s) => !ranked.includes(s)),
      ];
    } catch (error) {
      this.logger.warn(`AI suggestion ranking failed for "${query}": ${(error as Error).message}`);
      return candidates;
    }
  }

  /** Exact, uncapped creator count over the SAME trigram predicate as the
   * creator pool — the pool LIMIT is a fetch cap, not a quality bound. */
  private async fuzzyCreatorsCount(query: string): Promise<Array<{ count: number }>> {
    return this.prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
      SELECT count(*)::int AS count
      FROM creator_profiles c
      WHERE ${this.trigramOr(Prisma.sql`c."displayName"`, Prisma.sql`c.bio`, query)}
    `);
  }

  private async fuzzyUniverses(
    query: string,
    trigramWeight: number
  ): Promise<Array<{ uni: FuzzyUniverseRow; score: number; fuzzy: number; trigram: number }>> {
    const candidates = await this.prisma.$queryRaw<FuzzyUniverseRow[]>(Prisma.sql`
      SELECT u.id, u.name, u."displayName",
        similarity(u.name, ${query}) AS "nameSim",
        similarity(u."displayName", ${query}) AS "displayNameSim"
      FROM universes u
      WHERE ${this.trigramOr(Prisma.sql`u.name`, Prisma.sql`u."displayName"`, query)}
      ORDER BY
        GREATEST(similarity(u.name, ${query}), similarity(u."displayName", ${query})) DESC
      LIMIT ${SearchService.FUZZY_PERSON_POOL}
    `);

    return candidates
      .map((uni) => {
        const match = scoreFuzzyCandidate(
          query,
          uni.name,
          uni.displayName,
          uni.nameSim,
          uni.displayNameSim,
          trigramWeight
        );
        // Same admission rule as content: Levenshtein component >= threshold.
        return {
          uni,
          score: match.score,
          fuzzy: match.fuzzy,
          trigram: match.trigram,
        };
      })
      .filter((u) => u.fuzzy >= FUZZY_MATCH_THRESHOLD)
      .sort((a, b) => b.score - a.score);
  }

  /** Exact, uncapped universe count over the SAME trigram predicate as the
   * universe pool. */
  private async fuzzyUniversesCount(query: string): Promise<Array<{ count: number }>> {
    return this.prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
      SELECT count(*)::int AS count
      FROM universes u
      WHERE ${this.trigramOr(Prisma.sql`u.name`, Prisma.sql`u."displayName"`, query)}
    `);
  }

  /** Extra WHERE clauses for the fuzzy content pool: direct-column filters
   * (status is always applied; universe + date range are optional). */
  private fuzzyContentFiltersSql(filters: FacetedFilters | undefined): Prisma.Sql {
    const conds: Prisma.Sql[] = [];
    if (filters?.universe) {
      conds.push(Prisma.sql`ci."universeId" = ${filters.universe}`);
    }
    if (filters?.dateRange?.start) {
      conds.push(Prisma.sql`ci."createdAt" >= ${new Date(filters.dateRange.start)}`);
    }
    if (filters?.dateRange?.end) {
      conds.push(Prisma.sql`ci."createdAt" <= ${new Date(filters.dateRange.end)}`);
    }
    return conds.length ? Prisma.sql` AND ${Prisma.join(conds, ' AND ')}` : Prisma.empty;
  }

  /** Trigram match condition over two columns: similarity() above the SQL
   * retrieval threshold OR an ILIKE substring match (both index-backed by the
   * GIN trigram indexes). ILIKE guarantees exact substrings always enter the
   * pool regardless of trigram similarity. */
  private trigramOr(primary: Prisma.Sql, secondary: Prisma.Sql, query: string): Prisma.Sql {
    return Prisma.sql`(
      similarity(${primary}, ${query}) > ${SearchService.FUZZY_SQL_SIMILARITY_THRESHOLD}
      OR similarity(coalesce(${secondary}, ''), ${query}) > ${SearchService.FUZZY_SQL_SIMILARITY_THRESHOLD}
      OR ${primary} ILIKE ${'%' + query + '%'}
      OR ${secondary} ILIKE ${'%' + query + '%'}
    )`;
  }

  async searchWithFacets(query: string, filters?: FacetedFilters): Promise<SearchResponse> {
    // Kill-switch: faceted search defaults OFF until the facet pipeline is tuned.
    if (!(await this.featureFlagService.isEnabled(searchFlags.faceted))) {
      throw new BadRequestException('Faceted search is disabled');
    }
    if (!query || query.length < 2) {
      throw new BadRequestException('Search query must be at least 2 characters');
    }

    const escapedQuery = this.escapeRegex(query);

    const baseCondition: Record<string, unknown> = {
      OR: [
        { title: { contains: escapedQuery, mode: 'insensitive' } },
        { description: { contains: escapedQuery, mode: 'insensitive' } },
      ],
      status: 'published',
    };

    try {
      const [contentItems, facets] = await Promise.all([
        this.prisma.contentItem.findMany({
          where: {
            ...baseCondition,
            ...(filters?.universe ? { universeId: filters.universe } : {}),
            ...(filters?.categories && filters.categories.length > 0
              ? {
                  categories: { hasSome: filters.categories },
                }
              : {}),
            ...(filters?.tags && filters.tags.length > 0
              ? {
                  tags: { some: { id: { in: filters.tags } } },
                }
              : {}),
          },
          take: 50,
          orderBy: { createdAt: 'desc' },
        }),
        this.computeFacets(query),
      ]);

      const creators = await this.prisma.creatorProfile.findMany({
        where: { bio: { contains: escapedQuery, mode: 'insensitive' } },
        take: 20,
      });

      const universes = await this.prisma.universe.findMany({
        where: {
          OR: [
            { name: { contains: escapedQuery, mode: 'insensitive' } },
            { displayName: { contains: escapedQuery, mode: 'insensitive' } },
          ],
        },
        take: 10,
      });

      return {
        success: true,
        data: {
          query,
          results: {
            content: contentItems.map((item) => ({
              id: item.id,
              title: item.title,
              description: item.description,
              status: item.status,
              viewCount: item.viewCount || 0,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
              categories: item.categories ?? [],
              creatorName: item.creatorName ?? undefined,
            })),
            creators: creators.map((creator) => ({
              id: creator.id,
              bio: creator.bio,
              user: {
                id: creator.userId,
                username: creator.displayName || '',
                email: creator.email || '',
              },
            })),
            universes: universes.map((uni) => ({
              id: uni.id,
              name: uni.name,
              displayName: uni.displayName,
            })),
          },
          total: contentItems.length + creators.length + universes.length,
          facets,
        },
      };
    } catch (error: unknown) {
      this.logger.error('Failed to search with facets', error);
      mapAndThrow(error, 'performing faceted search');
    }
  }

  private async computeFacets(query: string): Promise<Facets> {
    const escapedQuery = this.escapeRegex(query);

    const baseCondition: Record<string, unknown> = {
      OR: [
        { title: { contains: escapedQuery, mode: 'insensitive' } },
        { description: { contains: escapedQuery, mode: 'insensitive' } },
      ],
      status: 'published',
    };

    const [universeCounts, contentTypeCounts, dateCounts] = await Promise.all([
      this.prisma.contentItem.groupBy({
        by: ['universeId'],
        where: baseCondition,
        _count: { id: true },
      }),
      this.prisma.contentItem.groupBy({
        by: ['contentType'],
        where: baseCondition,
        _count: { id: true },
      }),
      this.getDateRangeFacets(baseCondition),
    ]);

    const universes = await this.prisma.universe.findMany({
      where: { id: { in: universeCounts.map((u) => u.universeId) } },
    });

    type UniverseCount = (typeof universeCounts)[number];
    type ContentTypeCount = (typeof contentTypeCounts)[number];

    return {
      universes: universeCounts.map((u: UniverseCount) => ({
        id: u.universeId ?? 'unknown',
        name: universes.find((univ) => univ.id === u.universeId)?.name || 'Unknown',
        count: u._count.id,
      })),
      categories: [],
      tags: [],
      contentTypes: contentTypeCounts.map((ct: ContentTypeCount) => ({
        id: ct.contentType,
        name: ct.contentType,
        count: ct._count.id,
      })),
      dateRanges: dateCounts,
    };
  }

  private async getDateRangeFacets(baseCondition: Record<string, unknown>): Promise<Facet[]> {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const sevenDaysAgo = new Date(startOfToday);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const oneMonthAgo = new Date(startOfToday);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const oneYearAgo = new Date(startOfToday);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const ranges = [
      { label: 'Today', start: startOfToday },
      { label: 'This Week', start: sevenDaysAgo },
      { label: 'This Month', start: oneMonthAgo },
      { label: 'This Year', start: oneYearAgo },
      { label: 'Older', start: new Date(0), end: oneYearAgo },
    ];

    const dateFacets: Facet[] = [];
    for (const range of ranges) {
      const count = await this.prisma.contentItem.count({
        where: {
          ...baseCondition,
          createdAt: {
            ...(range.end ? { lt: range.end } : {}),
            gte: range.start,
          },
        },
      });
      dateFacets.push({ id: range.label, name: range.label, count });
    }

    return dateFacets;
  }

  async getSuggestions(query: string): Promise<SearchResponse> {
    if (!query || query.length < 1) {
      throw new BadRequestException('Search query must be at least 1 character');
    }

    const cacheK = cacheKey('search', `suggestions:${query}`);
    const cached = await this.cache.get<SearchResponse>(cacheK);
    if (cached) return cached;

    try {
      const candidates = await this.prisma.searchQueryLog.findMany({
        where: {
          query: { contains: this.escapeRegex(query), mode: 'insensitive' },
        },
        select: { query: true, resultCount: true },
        orderBy: { resultCount: 'desc' },
        take: 10,
      });

      // search_suggestions_ai (off): when enabled and an AI ranker is
      // configured, let it re-rank the popular candidates so suggestions
      // reflect semantic closeness to the partial query, not just past
      // popularity. Fail-open: any misconfiguration or error falls back to
      // the deterministic ranking below.
      let ranked = candidates.map((s) => s.query);
      if (await this.featureFlagService.isEnabled(searchFlags.suggestionsAi)) {
        ranked = await this.rankSuggestionsWithAi(query, ranked);
      }

      const result: SearchResponse = {
        success: true,
        data: {
          suggestions: ranked,
        },
      };

      await this.cache.set(cacheK, result, 300);
      return result;
    } catch (error: unknown) {
      this.logger.error('Failed to fetch search suggestions', error);
      mapAndThrow(error, 'fetching search suggestions');
    }
  }

  async getTrending(): Promise<SearchResponse> {
    try {
      // Cache-backed trending: skip the DB query and serve from Redis when enabled.
      if (await this.featureFlagService.isEnabled(searchFlags.trendingCached)) {
        const cacheK = cacheKey('search', 'trending');
        const cached = await this.cache.get<SearchResponse>(cacheK);
        if (cached) return cached;
        const trending = await this.prisma.searchQueryLog.findMany({
          orderBy: { resultCount: 'desc' },
          take: 20,
        });
        const result: SearchResponse = {
          success: true,
          data: {
            trending: trending.map((t) => ({ query: t.query, count: t.resultCount })),
          },
        };
        await this.cache.set(cacheK, result, 900);
        return result;
      }
      const trending = await this.prisma.searchQueryLog.findMany({
        orderBy: { resultCount: 'desc' },
        take: 20,
      });

      return {
        success: true,
        data: {
          trending: trending.map((t) => ({ query: t.query, count: t.resultCount })),
        },
      };
    } catch (error: unknown) {
      this.logger.error('Failed to fetch trending searches', error);
      mapAndThrow(error, 'fetching trending searches');
    }
  }

  async getFacets(_query?: string, _universe?: string): Promise<SearchResponse> {
    try {
      const universes = await this.prisma.universe.findMany({
        select: { id: true, name: true, displayName: true },
        where: { isEnabled: true },
      });

      // Get real content counts per universe
      const universeContentCounts = await this.prisma.contentItem.groupBy({
        by: ['universeId'],
        _count: { id: true },
      });
      const universeCountMap = new Map(
        universeContentCounts.map((u) => [u.universeId, u._count.id])
      );

      const categories = await this.prisma.contentItem.groupBy({
        by: ['universe'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 20,
      });

      const tags = await this.prisma.tag.findMany({
        select: { id: true, name: true },
        take: 50,
      });

      // Get real tag usage counts (fallback to empty if contentTag model doesn't exist)
      let tagCountMap = new Map<string, number>();
      try {
        const tagContentCounts = await (
          this.prisma as unknown as {
            contentTag?: {
              groupBy: (
                args: unknown
              ) => Promise<Array<{ tagId: string; _count: { tagId: number } }>>;
            };
          }
        ).contentTag?.groupBy({
          by: ['tagId'],
          _count: { tagId: true },
        });
        if (tagContentCounts) {
          tagCountMap = new Map(tagContentCounts.map((t) => [t.tagId, t._count.tagId]));
        }
      } catch {
        // contentTag model may not exist
      }

      const contentTypes = await this.prisma.contentItem.groupBy({
        by: ['universe'],
        _count: { id: true },
      });

      // Get real date range counts
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 7);
      const monthStart = new Date(todayStart);
      monthStart.setMonth(monthStart.getMonth() - 1);
      const yearStart = new Date(todayStart);
      yearStart.setFullYear(yearStart.getFullYear() - 1);

      const [todayCount, weekCount, monthCount, yearCount] = await Promise.all([
        this.prisma.contentItem.count({ where: { createdAt: { gte: todayStart } } }),
        this.prisma.contentItem.count({ where: { createdAt: { gte: weekStart } } }),
        this.prisma.contentItem.count({ where: { createdAt: { gte: monthStart } } }),
        this.prisma.contentItem.count({ where: { createdAt: { gte: yearStart } } }),
      ]);

      return {
        success: true,
        data: {
          facets: {
            universes: universes.map((u) => ({
              id: u.id,
              name: u.displayName || u.name,
              count: universeCountMap.get(u.id) || 0,
            })),
            categories: categories
              .filter((c) => c.universe)
              .map((c) => ({ id: c.universe!, name: c.universe!, count: c._count.id })),
            tags: tags.map((t) => ({ id: t.id, name: t.name, count: tagCountMap.get(t.id) || 0 })),
            contentTypes: contentTypes.map((ct) => ({
              id: ct.universe || 'unknown',
              name: ct.universe || 'unknown',
              count: ct._count.id,
            })),
            dateRanges: [
              { id: 'today', name: 'Today', count: todayCount },
              { id: 'week', name: 'This Week', count: weekCount },
              { id: 'month', name: 'This Month', count: monthCount },
              { id: 'year', name: 'This Year', count: yearCount },
            ],
          },
        },
      };
    } catch (error: unknown) {
      this.logger.error('Failed to fetch facets', error);
      mapAndThrow(error, 'fetching facets');
    }
  }

  async logSearch(
    userId: string,
    query: string,
    resultCount: number,
    correction?: string,
    accepted?: boolean
  ): Promise<SearchResponse> {
    // Kill-switch: stop writing search logs (storage cost, privacy surface).
    // The typo dictionary derives from these logs, so it shares the gate.
    if (!(await this.featureFlagService.isEnabled(searchFlags.logQueries))) {
      return {
        success: true,
        data: { message: 'Search logging disabled' },
      };
    }
    try {
      await this.prisma.searchQueryLog.create({
        data: { query, userId, resultCount },
      });

      await this.prisma.userSearch.create({
        data: { userId, query, resultCount },
      });

      // Learn popular corrections: every accepted 'did you mean' click
      // increments the (original query → correction) pair, so repeated
      // acceptance makes the suggestion sticky (see suggestedQuery in the
      // fuzzy path, gated by search_typo_dictionary).
      if (correction && accepted && correction.toLowerCase() !== query.toLowerCase()) {
        await this.prisma.searchTypoCorrection.upsert({
          where: {
            originalQuery_correctedQuery: {
              originalQuery: query,
              correctedQuery: correction,
            },
          },
          create: {
            originalQuery: query,
            correctedQuery: correction,
            count: 1,
          },
          update: {
            count: { increment: 1 },
            lastAcceptedAt: new Date(),
          },
        });
      }

      // Invalidate suggestions cache since search log affects trending
      await this.cache.delete(cacheKey('search', `suggestions:${query}`));

      return {
        success: true,
        data: { message: 'Search logged' },
      };
    } catch (error: unknown) {
      this.logger.error('Failed to log search', error);
      mapAndThrow(error, 'logging search');
    }
  }

  /**
   * Top learned corrections for a query (most-accepted first). Empty when the
   * typo dictionary has never seen the query.
   */
  async getTypoCorrections(query: string, limit = 5): Promise<SearchTypoCorrection[]> {
    try {
      return await this.prisma.searchTypoCorrection.findMany({
        where: { originalQuery: query },
        orderBy: [{ count: 'desc' }, { lastAcceptedAt: 'desc' }],
        take: limit,
      });
    } catch (error: unknown) {
      this.logger.error('Failed to read typo corrections', error);
      return [];
    }
  }

  // ── Admin queries ──────────────────────────────────────────────
  async getAdminStats() {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // The admin SPA's Search page renders totalSearchesToday, uniqueSearchers
    // and the fuzzy-guard block from this endpoint (it cannot reach the
    // /v1/admin/* duplicate of this route — the gateway maps /admin to the
    // admin-backend). Return the union of both stats contracts; the legacy
    // keys stay so existing consumers keep working.
    const [totalQueries, todayQueries, weekQueries, avgResultCount, totalSearchesToday, uniqueSearchers, fuzzy] =
      await Promise.all([
        this.prisma.searchQueryLog.count(),
        this.prisma.searchQueryLog.count({ where: { createdAt: { gte: today } } }),
        this.prisma.searchQueryLog.count({ where: { createdAt: { gte: weekAgo } } }),
        this.prisma.searchQueryLog.aggregate({ _avg: { resultCount: true } }),
        this.prisma.userSearch.count({ where: { createdAt: { gte: today } } }),
        this.prisma.userSearch
          .groupBy({ by: ['userId'], where: { createdAt: { gte: today } } })
          .then((groups) => groups.length),
        this.getFuzzyStatus(),
      ]);

    const topQueries = await this.prisma.searchQueryLog.groupBy({
      by: ['query'],
      _count: { query: true },
      orderBy: { _count: { query: 'desc' } },
      take: 10,
    });

    return {
      totalQueries,
      todayQueries,
      weekQueries,
      avgResultCount: avgResultCount._avg.resultCount ?? 0,
      topQueries: topQueries.map((q) => ({ query: q.query, count: q._count.query })),
      totalSearchesToday,
      uniqueSearchers,
      fuzzy,
    };
  }

  async getAdminQueries(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.searchQueryLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.searchQueryLog.count(),
    ]);
    return { items, total, page, limit, hasMore: skip + limit < total };
  }

  async repairIndexes() {
    // Re-create the GIN trigram indexes if missing
    try {
      await this.prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS idx_content_items_title_trgm ON content_items USING gin (title gin_trgm_ops)`
      );
      await this.prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS idx_content_items_description_trgm ON content_items USING gin (description gin_trgm_ops)`
      );
      return { success: true, data: { repaired: 2, indexes: ['title_trgm', 'description_trgm'] } };
    } catch (error: unknown) {
      this.logger.error('Failed to repair indexes', error);
      return { success: true, data: { repaired: 0, error: String(error) } };
    }
  }
}
