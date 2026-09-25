import { Inject, Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CdnPurgeService, CdnPurgeResult } from './cdn-purge.service';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '../../prisma/client';

export interface EnqueueResult {
  queued: boolean;
}

/** Which producer enqueued a row (audit trail in the reason column). */
export type CdnInvalidationReason =
  | 'delete'
  | 'reupload'
  | 'admin'
  | 'bulk'
  | 'flag-flip'
  | 'takedown'
  | 'failed'
  | 'skipped';

export interface ReconcileResult {
  /** Rows enqueued by this pass (metadata.cdnPurgeStatus was failed/skipped). */
  enqueued: { key: string; uploadId: string; reason: string }[];
  /** Rows that already had a pending queue entry and were left alone. */
  alreadyQueued: number;
  /** Uploads scanned. */
  scanned: number;
  /** Reconcile is best-effort; individual failures are reported, not fatal. */
  errors: { uploadId: string; reason: string }[];
}

export interface DrainResult {
  /** Queue rows claimed by this pass. */
  scanned: number;
  /** Number of CloudFront invalidation calls actually made. */
  invalidations: number;
  /** Rows whose invalidation succeeded (marked done, metadata stamped). */
  done: { id: string; key: string; invalidationId?: string }[];
  /** Rows dead-lettered after exceeding max attempts. */
  deadLettered: { id: string; key: string; attempts: number; error: string }[];
  /** Rows still pending (attempt budget remaining). */
  retried: { id: string; key: string; attempts: number; error?: string }[];
  /** Drain is best-effort; individual failures are reported, not fatal. */
  errors: { id: string; reason: string }[];
}

/** Row shape used across drain batching. */
interface QueueRow {
  id: string;
  key: string;
  attempts: number;
  reason: string;
}

/**
 * The single front-door for every CDN invalidation in media-service.
 *
 * All producers — delete-time evictions, re-upload evictions, admin purges
 * (keys or prefix), the media_cdn_edge_cache flag-flip sweep, takedown
 * lifecycle purges — enqueue rows here instead of calling CloudFront
 * directly. One place, one quota:
 *
 *  - CloudFront allows ≤1000 paths per invalidation and a small number of
 *    invalidations per minute; a burst of per-key deletes would blow through
 *    both. `drain()` claims up to MEDIA_CDN_INVALIDATION_BATCH_SIZE (default
 *    500, hard-capped at 1000) pending rows and submits them as ONE
 *    CreateInvalidation call; wildcard rows (key like 'uploads/*') each
 *    become one wildcard invalidation.
 *  - Durability: rows live in Postgres, so a crash between enqueue and
 *    invalidation loses nothing — the periodic sweep and the admin drain
 *    endpoint re-drive them. Attempts + dead-lettering bound retry storms.
 *  - Burst smoothing: after any enqueue, a debounced kick drains after
 *    MEDIA_CDN_INVALIDATION_DRAIN_DELAY_MS (default 5s), so N deletes in a
 *    5-second window coalesce into one invalidation instead of N.
 *
 * Row semantics: `key` holds either an exact object key ('uploads/x.jpg') or
 * a wildcard prefix path ('uploads/*'). `reason` records the producer
 * ('delete' | 'admin' | 'flag-flip' | 'takedown' | 'failed' | 'skipped').
 */
@Injectable()
export class CdnInvalidationQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CdnInvalidationQueueService.name);
  /** Nightly durability sweep hour (also the reconcile pass trigger). */
  private static readonly DEFAULT_NIGHTLY_HOUR = 3;
  private static readonly DEFAULT_MAX_ATTEMPTS = 5;
  private static readonly DEFAULT_BATCH_SIZE = 500;
  /** CloudFront hard limit: paths per invalidation. */
  private static readonly MAX_PATHS_PER_INVALIDATION = 1000;
  private static readonly DEFAULT_DRAIN_DELAY_MS = 5_000;
  /** Upper bound on invalidation calls per drain (quota protection). */
  private static readonly MAX_DRAIN_PASSES = 10;

  private sweepTimer?: ReturnType<typeof setInterval>;
  private drainTimer?: ReturnType<typeof setTimeout>;
  private sweeping = false;
  private draining = false;

  constructor(
    @Inject(CdnPurgeService) private readonly cdnPurgeService: CdnPurgeService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {}

  onModuleInit() {
    const hour = this.nightlyHour();
    this.sweepTimer = setInterval(() => void this.tick(hour), 60 * 60 * 1000);
    if (this.sweepTimer) {
      (this.sweepTimer as unknown as NodeJS.Timeout).unref();
    }
    this.logger.log(
      `CDN invalidation queue armed: durability sweep nightly at ` +
        `${String(hour).padStart(2, '0')}:00 local, batch ${this.batchSize()} ` +
        `paths/invalidation, max attempts ${this.maxAttempts()}`
    );
  }

  onModuleDestroy() {
    if (this.sweepTimer) {
      clearInterval(this.sweepTimer);
      this.sweepTimer = undefined;
    }
    if (this.drainTimer) {
      clearTimeout(this.drainTimer);
      this.drainTimer = undefined;
    }
  }

  /**
   * Hourly tick: once per night, run the durability sweep — reconcile any
   * media_uploads rows that predate the queue (or whose enqueue failed) and
   * drain whatever is pending. Day-to-day latency comes from the debounced
   * producer kick, not this timer.
   */
  private async tick(targetHour: number): Promise<void> {
    const now = new Date();
    if (now.getHours() !== targetHour || this.sweeping) return;
    this.sweeping = true;
    try {
      const reconcile = await this.reconcile();
      this.logger.log(
        `Nightly CDN invalidation reconcile: enqueued ${reconcile.enqueued.length}, ` +
          `alreadyQueued ${reconcile.alreadyQueued}, errors ${reconcile.errors.length}`
      );
      const drain = await this.drain();
      this.logger.log(
        `Nightly CDN invalidation drain: scanned ${drain.scanned}, ` +
          `invalidations ${drain.invalidations}, done ${drain.done.length}, ` +
          `deadLettered ${drain.deadLettered.length}, errors ${drain.errors.length}`
      );
    } finally {
      this.sweeping = false;
    }
  }

  /**
   * Enqueue one invalidation target. Idempotent while pending: a duplicate
   * exact key or wildcard path reuses the existing row (attempts preserved).
   * Kicks the debounced drain so bursts coalesce.
   */
  async enqueue(
    key: string,
    reason: CdnInvalidationReason,
    lastError?: string
  ): Promise<EnqueueResult> {
    const clean = key.trim().replace(/^\/+/, '');
    if (!clean) return { queued: false };
    const existing = await this.prisma.cdnInvalidationQueue.findFirst({
      where: { key: clean, status: 'pending' },
      select: { id: true },
    });
    if (existing) {
      await this.prisma.cdnInvalidationQueue.update({
        where: { id: existing.id },
        data: { lastError: lastError ?? null, reason },
      });
      this.kickDrain();
      return { queued: false };
    }
    await this.prisma.cdnInvalidationQueue.create({
      data: { key: clean, reason, lastError: lastError ?? null },
    });
    this.kickDrain();
    return { queued: true };
  }

  /** Debounced producer kick: drain once, DELAY_MS after the last enqueue. */
  private kickDrain(): void {
    if (this.drainTimer) clearTimeout(this.drainTimer);
    this.drainTimer = setTimeout(
      () => {
        this.drainTimer = undefined;
        void this.drain().catch((error: unknown) =>
          this.logger.error(`Debounced drain failed: ${(error as Error).message}`)
        );
      },
      this.drainDelayMs()
    );
    (this.drainTimer as unknown as NodeJS.Timeout).unref();
  }

  /**
   * Compensating sweep: find media_uploads rows whose metadata still says
   * failed/skipped (pre-queue history, or an enqueue that failed after the
   * metadata write) and enqueue their keys. Rows with a pending entry are
   * skipped (attempts preserved).
   */
  async reconcile(batchSize = this.batchSize()): Promise<ReconcileResult> {
    const result: ReconcileResult = { enqueued: [], alreadyQueued: 0, scanned: 0, errors: [] };
    try {
      const rows = await this.prisma.mediaUpload.findMany({
        where: {
          OR: [
            { metadata: { path: ['cdnPurgeStatus'], equals: 'failed' } },
            { metadata: { path: ['cdnPurgeStatus'], equals: 'skipped' } },
          ],
        },
        select: { id: true, key: true, metadata: true },
        take: batchSize,
      });
      result.scanned = rows.length;
      for (const row of rows) {
        const meta = row.metadata as Record<string, unknown> | null;
        const reason = meta?.cdnPurgeStatus === 'skipped' ? 'skipped' : 'failed';
        try {
          const existing = await this.prisma.cdnInvalidationQueue.findFirst({
            where: { key: row.key, status: 'pending' },
            select: { id: true },
          });
          if (existing) {
            result.alreadyQueued++;
            continue;
          }
          await this.prisma.cdnInvalidationQueue.create({
            data: {
              key: row.key,
              reason,
              lastError:
                typeof meta?.cdnPurgeError === 'string' ? meta.cdnPurgeError : null,
            },
          });
          result.enqueued.push({ key: row.key, uploadId: row.id, reason });
        } catch (error) {
          result.errors.push({ uploadId: row.id, reason: (error as Error).message });
        }
      }
    } catch (error) {
      this.logger.error(`CDN invalidation reconcile failed: ${(error as Error).message}`);
      result.errors.push({ uploadId: '*', reason: (error as Error).message });
    }
    return result;
  }

  /**
   * Batched drain: claim pending rows, submit exact keys as ONE invalidation
   * (deduped, ≤ batch size ≤ CloudFront's 1000-path cap) and each distinct
   * wildcard as its own, then mark done/retry/dead-letter per batch outcome.
   *
   * Bursts larger than one invalidation's path cap are drained with bounded
   * follow-up passes (each pass = one more invalidation), so a 5,000-key
   * burst costs 10 invalidations — never 5,000. A pass that completes no
   * rows stops the loop: retrying the same failing batch inside one drain
   * would only burn attempt budgets; the next kick/sweep re-drives later.
   */
  async drain(batchSize = this.batchSize()): Promise<DrainResult> {
    const result: DrainResult = {
      scanned: 0,
      invalidations: 0,
      done: [],
      deadLettered: [],
      retried: [],
      errors: [],
    };
    if (this.draining) return result;
    this.draining = true;
    try {
      const cap = Math.min(batchSize, CdnInvalidationQueueService.MAX_PATHS_PER_INVALIDATION);
      for (let pass = 0; pass < CdnInvalidationQueueService.MAX_DRAIN_PASSES; pass++) {
        let rows: QueueRow[] = [];
        try {
          rows = await this.prisma.cdnInvalidationQueue.findMany({
            where: { status: 'pending' },
            orderBy: { createdAt: 'asc' },
            take: cap,
            select: { id: true, key: true, attempts: true, reason: true },
          });
        } catch (error) {
          result.errors.push({ id: '*', reason: (error as Error).message });
          return result;
        }
        if (rows.length === 0) break;
        result.scanned += rows.length;
        const doneBefore = result.done.length;

        const wildcard = new Map<string, QueueRow[]>();
        const exact = new Map<string, QueueRow[]>();
        for (const row of rows) {
          const bucket = row.key.endsWith('/*') ? wildcard : exact;
          const list = bucket.get(row.key) ?? [];
          list.push(row);
          bucket.set(row.key, list);
        }

        // Exact keys → one batched invalidation.
        if (exact.size > 0) {
          const paths = [...exact.keys()];
          await this.submitBatch(paths, [...exact.values()].flat(), result);
        }
        // Each distinct wildcard prefix → its own invalidation.
        for (const [pattern, patternRows] of wildcard) {
          await this.submitBatch([pattern], patternRows, result);
        }

        // No progress this pass → stop; more passes would just re-submit the
        // same failing rows and burn their attempt budgets.
        if (result.done.length === doneBefore) break;
      }
    } finally {
      this.draining = false;
    }
    return result;
  }

  /**
   * Submit one invalidation covering `paths` and bookkeep every row in
   * `rows` according to the outcome (done / retry / dead-letter).
   */
  private async submitBatch(
    paths: string[],
    rows: QueueRow[],
    result: DrainResult
  ): Promise<void> {
    const maxAttempts = this.maxAttempts();
    let purge: CdnPurgeResult | undefined;
    let purgeError: string | undefined;
    try {
      purge = await this.cdnPurgeService.purgeKeys(paths);
      result.invalidations++;
    } catch (error) {
      purgeError = (error as Error).message;
    }

    if (purge && purge.purged > 0) {
      try {
        await this.prisma.cdnInvalidationQueue.updateMany({
          where: { id: { in: rows.map((r) => r.id) } },
          data: { status: 'done', attempts: { increment: 1 }, lastError: null },
        });
        for (const row of rows) {
          result.done.push({ id: row.id, key: row.key, invalidationId: purge.invalidationId });
        }
        await this.stampUploadMetadata(
          rows.map((r) => r.key),
          {
            cdnPurgeStatus: 'invalidated',
            ...(purge.invalidationId ? { cdnPurgeInvalidationId: purge.invalidationId } : {}),
          }
        );
      } catch (dbError) {
        // Purge succeeded but bookkeeping failed: rows stay pending, so the
        // next drain re-stamps (re-invalidating is harmless/idempotent).
        result.errors.push({ id: rows[0].id, reason: (dbError as Error).message });
      }
      return;
    }

    // Purge skipped (CDN unconfigured) or threw — consume an attempt on every row.
    const error = purgeError ?? 'CDN not configured (no invalidation created)';
    const exhausted = rows.filter((r) => r.attempts + 1 >= maxAttempts);
    const remaining = rows.filter((r) => r.attempts + 1 < maxAttempts);
    try {
      if (exhausted.length > 0) {
        await this.prisma.cdnInvalidationQueue.updateMany({
          where: { id: { in: exhausted.map((r) => r.id) } },
          data: { status: 'dead', attempts: { increment: 1 }, lastError: error },
        });
        for (const row of exhausted) {
          result.deadLettered.push({ id: row.id, key: row.key, attempts: row.attempts + 1, error });
        }
        // Stamp the upload rows so ops audits show a terminal failure (not an
        // eternal 'queued'). The nightly reconcile re-enqueues 'failed' rows,
        // giving dead-lettered keys one gentle retry attempt per night.
        await this.stampUploadMetadata(
          exhausted.map((r) => r.key),
          { cdnPurgeStatus: 'failed', cdnPurgeError: error }
        );
      }
      if (remaining.length > 0) {
        await this.prisma.cdnInvalidationQueue.updateMany({
          where: { id: { in: remaining.map((r) => r.id) } },
          data: { attempts: { increment: 1 }, lastError: error },
        });
        for (const row of remaining) {
          result.retried.push({ id: row.id, key: row.key, attempts: row.attempts + 1, error });
        }
      }
    } catch (dbError) {
      result.errors.push({ id: rows[0].id, reason: (dbError as Error).message });
    }
  }

  /**
   * Merge the purge outcome onto media_uploads rows for the given keys (same
   * flat-key convention as UploadService — read-modify-write so unrelated
   * metadata like scanStatus survives). Best-effort.
   */
  private async stampUploadMetadata(
    keys: string[],
    outcome: Record<string, string>
  ): Promise<void> {
    try {
      const rows = await this.prisma.mediaUpload.findMany({
        where: { key: { in: keys } },
        select: { id: true, metadata: true },
      });
      if (rows.length === 0) return;
      await this.prisma.$transaction(
        rows.map((row) => {
          const existing: Record<string, unknown> =
            row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
              ? (row.metadata as Record<string, unknown>)
              : {};
          return this.prisma.mediaUpload.update({
            where: { id: row.id },
            data: {
              metadata: {
                ...existing,
                ...outcome,
              } as unknown as Prisma.InputJsonValue,
            },
          });
        })
      );
    } catch (error) {
      this.logger.warn(
        `Failed to stamp purge outcome for ${keys.length} key(s): ${(error as Error).message}`
      );
    }
  }

  private nightlyHour(): number {
    const h = this.configService.get<number>('MEDIA_CDN_INVALIDATION_NIGHTLY_HOUR') ??
      CdnInvalidationQueueService.DEFAULT_NIGHTLY_HOUR;
    return Number.isInteger(h) && h >= 0 && h <= 23
      ? h
      : CdnInvalidationQueueService.DEFAULT_NIGHTLY_HOUR;
  }

  private maxAttempts(): number {
    const n = this.configService.get<number>('MEDIA_CDN_INVALIDATION_MAX_ATTEMPTS') ??
      CdnInvalidationQueueService.DEFAULT_MAX_ATTEMPTS;
    return Number.isFinite(n) && n > 0 ? n : CdnInvalidationQueueService.DEFAULT_MAX_ATTEMPTS;
  }

  private batchSize(): number {
    const n = this.configService.get<number>('MEDIA_CDN_INVALIDATION_BATCH_SIZE') ??
      CdnInvalidationQueueService.DEFAULT_BATCH_SIZE;
    return Number.isFinite(n) && n > 0 ? n : CdnInvalidationQueueService.DEFAULT_BATCH_SIZE;
  }

  private drainDelayMs(): number {
    const n = this.configService.get<number>('MEDIA_CDN_INVALIDATION_DRAIN_DELAY_MS') ??
      CdnInvalidationQueueService.DEFAULT_DRAIN_DELAY_MS;
    return Number.isFinite(n) && n >= 0 ? n : CdnInvalidationQueueService.DEFAULT_DRAIN_DELAY_MS;
  }
}
