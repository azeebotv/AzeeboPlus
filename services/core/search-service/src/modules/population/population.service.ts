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
import { MetricsService } from '../metrics/metrics.service.js';
import { ContentDbService, type ContentSourceRow } from './content-db.service.js';

export interface PopulationSummary {
  trigger: 'startup' | 'schedule';
  /** Present when the run was skipped (flag off or an earlier run in flight). */
  skipped?: boolean;
  reason?: string;
  fetched: number;
  upserted: number;
  at: string;
}

const DEFAULT_CRON = '*/5 * * * *';
const JOB_NAME = 'search-index-population';

/**
 * Scheduled job that keeps the search index's denormalized columns in sync
 * with the content DB: it reads published content_items (categories resolved
 * through the content_categories relation, creator displayName from the
 * content DB's users table) and upserts them into the search DB. Runs on a
 * cron schedule (default every 5 minutes, `SEARCH_INDEX_POPULATION_CRON`
 * override — resolved from config so `.env` values apply) plus once at
 * startup, gated by the `search_index_population` flag. Safe to run from
 * multiple triggers: an in-process lock prevents overlapping runs in the same
 * instance.
 */
@Injectable()
export class PopulationService implements OnApplicationBootstrap, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PopulationService.name);
  private running = false;
  private job?: CronJob;

  constructor(
    @Inject(ContentDbService) private readonly contentDb: ContentDbService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(FeatureFlagService) private readonly featureFlagService: FeatureFlagService,
    @Inject(ConfigService) private readonly config: ConfigService,
    @Inject(SchedulerRegistry) private readonly scheduler: SchedulerRegistry,
    @Inject(MetricsService) private readonly metrics: MetricsService
  ) {}

  /** Register the recurring job from the resolved cron expression. The static
   * `@Cron` decorator can't be used here because it evaluates before
   * ConfigModule loads `.env`; dynamic registration reads the real value. */
  async onModuleInit(): Promise<void> {
    const expression = this.config.get<string>('SEARCH_INDEX_POPULATION_CRON') || DEFAULT_CRON;
    const job = new CronJob(expression, () => {
      void this.scheduledRun();
    });
    this.job = job;
    this.scheduler.addCronJob(JOB_NAME, job);
    job.start();
    this.logger.log(`Index population scheduled: cron "${expression}" (${JOB_NAME})`);
  }

  /** Stop the recurring job on shutdown so the pending timer never keeps the
   * process (or a test run) alive after teardown. */
  async onModuleDestroy(): Promise<void> {
    this.job?.stop();
    this.job = undefined;
  }

  async onApplicationBootstrap(): Promise<void> {
    await this.safeRun('startup');
  }

  /** Cron callback — also invoked directly by specs. */
  async scheduledRun(): Promise<void> {
    await this.safeRun('schedule');
  }

  /** Run the population once; never throws (errors are logged so the next
   * scheduled tick can retry). */
  private async safeRun(trigger: 'startup' | 'schedule'): Promise<void> {
    try {
      await this.runOnce(trigger);
    } catch (error: unknown) {
      this.metrics.recordPopulationRun('error', 0);
      this.logger.error(
        `Search-index population (${trigger}) failed: ${(error as Error).message}`,
        (error as Error).stack
      );
    }
  }

  /** Public entry point (also used by specs): executes one full pass. */
  async runOnce(trigger: 'startup' | 'schedule' = 'schedule'): Promise<PopulationSummary> {
    if (!(await this.featureFlagService.isEnabled(searchFlags.indexPopulation))) {
      this.logger.log('Skipping index population (search_index_population disabled)');
      this.metrics.recordPopulationRun('skipped', 0);
      return {
        trigger,
        skipped: true,
        reason: 'search_index_population disabled',
        fetched: 0,
        upserted: 0,
        at: new Date().toISOString(),
      };
    }

    if (this.running) {
      this.logger.warn('Skipping index population — a run is already in flight');
      this.metrics.recordPopulationRun('skipped', 0);
      return {
        trigger,
        skipped: true,
        reason: 'already running',
        fetched: 0,
        upserted: 0,
        at: new Date().toISOString(),
      };
    }

    this.running = true;
    const batchSize = this.batchSize();
    let cursor = '';
    let fetched = 0;
    let upserted = 0;

    try {
      let hasMore = true;
      while (hasMore) {
        const page = await this.contentDb.fetchPage(cursor, batchSize);
        if (page.length === 0) break;
        fetched += page.length;
        await this.upsertPage(page);
        upserted += page.length;
        cursor = page[page.length - 1].id;
        hasMore = page.length === batchSize;
      }

      this.logger.log(
        `Search-index population (${trigger}): ${fetched} rows fetched, ${upserted} upserted`
      );
      this.metrics.recordPopulationRun('success', upserted);
      return { trigger, fetched, upserted, at: new Date().toISOString() };
    } finally {
      this.running = false;
    }
  }

  private batchSize(): number {
    const raw = this.config.get<string>('SEARCH_INDEX_POPULATION_BATCH_SIZE');
    const parsed = Number(raw);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 100;
  }

  /** Upsert one page in a single transaction. `create` and `update` carry the
   * same denormalized payload, so a page is idempotent. */
  private async upsertPage(page: ContentSourceRow[]): Promise<void> {
    await this.prisma.$transaction(
      page.map((row) =>
        this.prisma.contentItem.upsert({
          where: { id: row.id },
          create: toIndexRow(row),
          update: toIndexRow(row),
        })
      )
    );
  }
}

/** Map a content-DB row onto the search index's ContentItem model. */
function toIndexRow(row: ContentSourceRow) {
  return {
    title: row.title,
    description: row.description,
    thumbnail: row.thumbnail,
    duration: row.duration,
    universeId: row.universeId,
    // This platform's content types ARE its universes.
    universe: row.universe,
    contentType: row.universe,
    status: row.status,
    viewCount: row.viewCount,
    creatorId: row.creatorId,
    categories: row.categories,
    creatorName: row.creatorName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
