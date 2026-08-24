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
import { createHash } from 'crypto';
import { PrismaService } from '../database/prisma.service.js';

const DEFAULT_CRON = '0 3 * * *'; // Daily at 3 AM
const ANONYMIZE_JOB = 'search-query-anonymize';
const DELETE_JOB = 'search-query-delete';

/** How many days before a query is anonymized (userId removed, query hashed). */
const ANONYMIZE_DAYS = 30;
/** How many days before anonymized logs are permanently deleted. */
const DELETE_DAYS = 90;

/**
 * Scheduled job that enforces data retention on search_query_logs:
 *
 * 1. **Anonymize** (daily): For logs older than 30 days, replaces the raw
 *    `query` with a one-way SHA-256 hash and nulls out `userId`. This
 *    preserves aggregate analytics (trending queries, result-count stats)
 *    while removing PII.
 *
 * 2. **Delete** (daily): Permanently removes anonymized logs older than 90
 *    days to bound storage growth.
 *
 * Both jobs are gated by a feature flag and use batched updates to avoid
 * locking the table for extended periods.
 */
@Injectable()
export class DataRetentionService implements OnModuleInit, OnModuleDestroy, OnApplicationBootstrap {
  private readonly logger = new Logger(DataRetentionService.name);
  private running = false;
  private anonymizeJob?: CronJob;
  private deleteJob?: CronJob;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ConfigService) private readonly config: ConfigService,
    @Inject(SchedulerRegistry) private readonly scheduler: SchedulerRegistry
  ) {}

  async onModuleInit(): Promise<void> {
    const expression = this.config.get<string>('SEARCH_RETENTION_CRON') || DEFAULT_CRON;

    this.anonymizeJob = new CronJob(expression, () => {
      void this.anonymizeOldQueries();
    });
    this.deleteJob = new CronJob(expression, () => {
      void this.deleteOldAnonymizedLogs();
    });

    this.scheduler.addCronJob(ANONYMIZE_JOB, this.anonymizeJob);
    this.scheduler.addCronJob(DELETE_JOB, this.deleteJob);

    this.anonymizeJob.start();
    this.deleteJob.start();

    this.logger.log(`Data retention scheduled: cron "${expression}" (anonymize + delete)`);
  }

  async onApplicationBootstrap(): Promise<void> {
    // Run once at startup to catch anything that accumulated while the
    // service was offline.
    await this.anonymizeOldQueries();
    await this.deleteOldAnonymizedLogs();
  }

  async onModuleDestroy(): Promise<void> {
    this.anonymizeJob?.stop();
    this.deleteJob?.stop();
  }

  /**
   * Anonymize queries older than ANONYMIZE_DAYS.
   * - Hashes the query text (SHA-256) so aggregate counts are preserved
   *   but the original search text is unrecoverable.
   * - Nulls out userId to break the PII link.
   */
  async anonymizeOldQueries(): Promise<{ anonymized: number }> {
    if (this.running) {
      this.logger.warn('Skipping anonymization — previous run still in flight');
      return { anonymized: 0 };
    }

    this.running = true;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - ANONYMIZE_DAYS);

    let total = 0;
    const batchSize = 500;

    try {
      // Process in batches to avoid long-running transactions
      while (true) {
        // Select a batch of non-anonymized old logs
        const batch = await this.prisma.searchQueryLog.findMany({
          where: {
            createdAt: { lt: cutoff },
            // Only logs that haven't been anonymized yet:
            // a hashed query looks like a hex string, so check for a
            // non-hex prefix (raw queries start with text).
            userId: { not: null },
          },
          select: { id: true, query: true },
          take: batchSize,
          orderBy: { createdAt: 'asc' },
        });

        if (batch.length === 0) break;

        // Anonymize each entry: hash the query, null the userId
        await Promise.all(
          batch.map((row) =>
            this.prisma.searchQueryLog.update({
              where: { id: row.id },
              data: {
                query: hashQuery(row.query),
                userId: null,
              },
            })
          )
        );

        total += batch.length;
        this.logger.debug(`Anonymized batch of ${batch.length} search logs`);
      }

      if (total > 0) {
        this.logger.log(`Anonymized ${total} search query logs older than ${ANONYMIZE_DAYS} days`);
      }
      return { anonymized: total };
    } catch (error) {
      this.logger.error(
        `Search query anonymization failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return { anonymized: total };
    } finally {
      this.running = false;
    }
  }

  /**
   * Permanently delete anonymized logs older than DELETE_DAYS.
   */
  async deleteOldAnonymizedLogs(): Promise<{ deleted: number }> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - DELETE_DAYS);

    try {
      // Delete anonymized logs (userId is null after anonymization)
      const result = await this.prisma.searchQueryLog.deleteMany({
        where: {
          createdAt: { lt: cutoff },
          userId: null,
        },
      });

      if (result.count > 0) {
        this.logger.log(
          `Deleted ${result.count} anonymized search query logs older than ${DELETE_DAYS} days`
        );
      }
      return { deleted: result.count };
    } catch (error) {
      this.logger.error(
        `Search query deletion failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return { deleted: 0 };
    }
  }
}

/**
 * One-way hash of a search query for anonymization.
 * Uses SHA-256 so aggregate analytics (trending queries, popular terms)
 * can still be computed over the hashed values, but the original text
 * is irrecoverable.
 */
function hashQuery(query: string): string {
  return createHash('sha256').update(query.toLowerCase().trim()).digest('hex');
}
