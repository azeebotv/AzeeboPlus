import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { FeatureFlagService, searchFlags } from '@azeebo/feature-flags';
import { PrismaService } from '../database/prisma.service.js';
import { SearchService } from '../search/search.service.js';
import { Prisma } from '../../prisma/client/index.js';

export type RepairTrigger = 'startup' | 'cron' | 'manual';

export interface RepairSummary {
  trigger: RepairTrigger;
  /** True when the DDL actually ran (extension present, indexes missing). */
  repaired: boolean;
  reason:
    | 'flag-disabled'
    | 'cooldown'
    | 'extension-missing'
    | 'indexes-present'
    | 'repaired'
    | 'failed';
  /** The index names this run attempted to (re)create. */
  indexes: string[] | null;
  at: string;
}

const JOB_NAME = 'search-index-repair';
const DEFAULT_CRON = '*/5 * * * *';
const DEFAULT_COOLDOWN_MS = 5 * 60 * 1000;

/**
 * Self-healing job for the SearchPgTrgmIndexesMissing condition: when the
 * pg_trgm extension is present but the migration's GIN trigram indexes are
 * missing, (re)create them with the exact migration definitions
 * (CREATE INDEX CONCURRENTLY IF NOT EXISTS, so it's idempotent and never
 * blocks reads/writes on the tables). Runs at startup, on a cron
 * (SEARCH_INDEX_REPAIR_CRON, default every 5 minutes — matching the alert's
 * `for: 5m`, so healing usually preempts the alert), and on demand via
 * POST /v1/search/admin/indexes/repair (the Alertmanager webhook target).
 *
 * Guards: gated by `search_index_repair`, rate-limited by a cooldown (attempts
 * at most once per SEARCH_INDEX_REPAIR_COOLDOWN_MS, default 5m, even on
 * failure), and it verifies the exact alert condition before running DDL — the
 * extension alone is never created (that needs elevated privileges and is the
 * migration's job), and healthy indexes make every trigger a no-op.
 */
@Injectable()
export class IndexRepairService
  implements OnApplicationBootstrap, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(IndexRepairService.name);
  private lastAttemptMs = 0;
  private job?: CronJob;

  // The six GIN trigram indexes from migration 20260810000001_pg_trgm_fuzzy_search,
  // recreated verbatim so the probe's pg_indexes count sees them as present.
  private static readonly REPAIR_STATEMENTS = [
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS content_items_title_trgm_idx ON content_items USING gin (title gin_trgm_ops)',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS content_items_description_trgm_idx ON content_items USING gin (description gin_trgm_ops)',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS creator_profiles_displayName_trgm_idx ON creator_profiles USING gin ("displayName" gin_trgm_ops)',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS creator_profiles_bio_trgm_idx ON creator_profiles USING gin (bio gin_trgm_ops)',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS universes_name_trgm_idx ON universes USING gin (name gin_trgm_ops)',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS universes_displayName_trgm_idx ON universes USING gin ("displayName" gin_trgm_ops)',
  ];

  // The names the DDL above actually produces: the CREATE INDEX statements
  // are unquoted, so PostgreSQL folds the mixed-case ones to lowercase
  // (creator_profiles_displayname_trgm_idx, universes_displayname_trgm_idx).
  // The probe must compare against these folded names or it can never see the
  // indexes as present — which would loop this job forever even when healthy.
  private static readonly INDEX_NAMES = [
    'content_items_title_trgm_idx',
    'content_items_description_trgm_idx',
    'creator_profiles_displayname_trgm_idx',
    'creator_profiles_bio_trgm_idx',
    'universes_name_trgm_idx',
    'universes_displayname_trgm_idx',
  ];

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(FeatureFlagService) private readonly featureFlagService: FeatureFlagService,
    @Inject(ConfigService) private readonly config: ConfigService,
    @Inject(SchedulerRegistry) private readonly scheduler: SchedulerRegistry,
    @Inject(SearchService) private readonly searchService: SearchService
  ) {}

  async onModuleInit(): Promise<void> {
    const expression = this.config.get<string>('SEARCH_INDEX_REPAIR_CRON') || DEFAULT_CRON;
    const job = new CronJob(expression, () => {
      void this.repairMissingIndexes('cron');
    });
    this.job = job;
    this.scheduler.addCronJob(JOB_NAME, job);
    job.start();
    this.logger.log(`Index repair scheduled: cron "${expression}" (${JOB_NAME})`);
  }

  /** Stop the recurring job on shutdown so the pending timer never keeps the
   * process (or a test run) alive after teardown. */
  async onModuleDestroy(): Promise<void> {
    this.job?.stop();
    this.job = undefined;
  }

  async onApplicationBootstrap(): Promise<void> {
    await this.repairMissingIndexes('startup');
  }

  /** Check whether the alert condition holds: extension present, indexes
   * missing. Returns null when the check itself fails (DB unreachable). */
  private async probeState(): Promise<{
    extensionPresent: boolean;
    indexesPresent: boolean;
  } | null> {
    try {
      const rows = await this.prisma.$queryRaw<
        Array<{ extensionPresent: boolean; indexesPresent: boolean }>
      >(Prisma.sql`
        SELECT
          EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') AS "extensionPresent",
          (
            SELECT count(*) FROM pg_indexes
            WHERE schemaname = current_schema()
              AND indexname IN (${Prisma.join(IndexRepairService.INDEX_NAMES)})
          ) = ${IndexRepairService.INDEX_NAMES.length} AS "indexesPresent"
      `);
      return {
        extensionPresent: rows[0]?.extensionPresent ?? false,
        indexesPresent: rows[0]?.indexesPresent ?? false,
      };
    } catch (error: unknown) {
      this.logger.warn(
        `Index repair state probe failed (${(error as Error).message}) — skipping this pass`,
        (error as Error).stack
      );
      return null;
    }
  }

  async repairMissingIndexes(trigger: RepairTrigger): Promise<RepairSummary> {
    const at = new Date().toISOString();

    if (!(await this.featureFlagService.isEnabled(searchFlags.indexRepair))) {
      this.logger.log('Skipping index repair (search_index_repair disabled)');
      return { trigger, repaired: false, reason: 'flag-disabled', indexes: null, at };
    }

    const cooldownMs = this.cooldownMs();
    if (Date.now() - this.lastAttemptMs < cooldownMs) {
      this.logger.debug('Skipping index repair — inside cooldown window');
      return { trigger, repaired: false, reason: 'cooldown', indexes: null, at };
    }
    this.lastAttemptMs = Date.now();

    const state = await this.probeState();
    if (!state) {
      return { trigger, repaired: false, reason: 'failed', indexes: null, at };
    }
    if (!state.extensionPresent) {
      this.logger.log(
        'Skipping index repair — pg_trgm extension is missing (creating extensions is the migration\'s job)'
      );
      return { trigger, repaired: false, reason: 'extension-missing', indexes: null, at };
    }
    if (state.indexesPresent) {
      return { trigger, repaired: false, reason: 'indexes-present', indexes: null, at };
    }

    this.logger.warn(
      `SearchPgTrgmIndexesMissing condition detected — recreating ${IndexRepairService.REPAIR_STATEMENTS.length} GIN trigram indexes (${trigger})`
    );
    try {
      for (const statement of IndexRepairService.REPAIR_STATEMENTS) {
        await this.prisma.$executeRawUnsafe(statement);
      }
      this.logger.log(
        `Recreated GIN trigram indexes: ${IndexRepairService.INDEX_NAMES.join(', ')}`
      );
      // Refresh the probe state so /health and the metrics gauges flip to
      // 'present' immediately instead of waiting for the next 60s probe.
      await this.searchService.refreshFuzzyProbe();
      return {
        trigger,
        repaired: true,
        reason: 'repaired',
        indexes: IndexRepairService.INDEX_NAMES,
        at,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Failed to recreate GIN trigram indexes (${(error as Error).message}) — will retry after the cooldown`,
        (error as Error).stack
      );
      return { trigger, repaired: false, reason: 'failed', indexes: null, at };
    }
  }

  private cooldownMs(): number {
    const raw = this.config.get<string>('SEARCH_INDEX_REPAIR_COOLDOWN_MS');
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_COOLDOWN_MS;
  }
}
