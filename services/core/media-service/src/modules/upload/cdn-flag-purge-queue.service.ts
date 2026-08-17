import { Inject, Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FeatureFlagService, mediaFlags } from '@azeebo/feature-flags';
import { CdnPurgeService } from './cdn-purge.service';

/**
 * Automates the media_cdn_edge_cache flip: when the flag transitions
 * on → off, a full-prefix CDN purge job is queued so already-cached uploads
 * are evicted without ops calling POST /admin/cdn/purge manually.
 *
 * The flag is polled on an interval (the feature-flags cache TTL is 30s, so a
 * 30s poll keeps the detection lag bounded). Detection is transition-based:
 * the first poll only seeds the last-known state, so booting with the flag
 * already off never triggers a purge. Jobs run through a tiny in-process
 * queue (deduped by key, executed one at a time) — the same job boundary a
 * BullMQ content-processing worker could later consume.
 */
@Injectable()
export class CdnFlagPurgeQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CdnFlagPurgeQueueService.name);
  private static readonly DEFAULT_POLL_MS = 30_000;
  private static readonly PURGE_PREFIX = 'uploads';
  private static readonly PURGE_JOB_KEY = `cdn-purge-prefix:${CdnFlagPurgeQueueService.PURGE_PREFIX}`;

  private lastKnownEnabled?: boolean;
  private timer?: ReturnType<typeof setInterval>;
  /** FIFO of pending job keys. */
  private queue: string[] = [];
  /** Dedup set for keys already queued. */
  private queued = new Set<string>();
  private running = false;

  constructor(
    @Inject(FeatureFlagService) private readonly featureFlagService: FeatureFlagService,
    @Inject(CdnPurgeService) private readonly cdnPurgeService: CdnPurgeService,
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {}

  onModuleInit() {
    const pollMs =
      this.configService.get<number>('MEDIA_CDN_FLAG_POLL_MS') ??
      CdnFlagPurgeQueueService.DEFAULT_POLL_MS;
    const safePollMs =
      Number.isFinite(pollMs) && pollMs > 0 ? pollMs : CdnFlagPurgeQueueService.DEFAULT_POLL_MS;

    // Seed the last-known state before starting the interval so a boot with
    // the flag already off does not fire a spurious purge.
    void this.checkFlag();

    this.timer = setInterval(() => void this.checkFlag(), safePollMs);
    // Do not hold the process open just for the poller (dev/test hygiene).
    if (this.timer) {
      (this.timer as unknown as NodeJS.Timeout).unref();
    }
    this.logger.log(`Watching media_cdn_edge_cache every ${safePollMs}ms for on→off transitions`);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  /** Polls the flag and enqueues a purge job on an on→off transition. */
  private async checkFlag(): Promise<void> {
    try {
      const enabled = await this.featureFlagService.isEnabled(mediaFlags.cdnEdgeCache);
      const previous = this.lastKnownEnabled;
      this.lastKnownEnabled = enabled;

      if (previous === true && enabled === false) {
        this.logger.warn('media_cdn_edge_cache toggled off — enqueueing CDN purge job');
        this.enqueue(CdnFlagPurgeQueueService.PURGE_JOB_KEY);
      }
    } catch (error) {
      // A poll failure must never crash the service; retry next interval.
      this.logger.warn(`Failed to poll media_cdn_edge_cache: ${(error as Error).message}`);
    }
  }

  /** Queues a purge job (deduped by key) and kicks the worker. */
  private enqueue(jobKey: string): void {
    if (this.queued.has(jobKey)) {
      this.logger.warn(`CDN purge job ${jobKey} already queued; skipping duplicate`);
      return;
    }
    this.queued.add(jobKey);
    this.queue.push(jobKey);
    void this.drain();
  }

  /** Executes queued jobs one at a time. */
  private async drain(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      while (this.queue.length > 0) {
        const jobKey = this.queue.shift() as string;
        this.queued.delete(jobKey);
        await this.execute(jobKey);
      }
    } finally {
      this.running = false;
    }
  }

  /** Runs a single purge job: full invalidation of the uploads prefix. */
  private async execute(jobKey: string): Promise<void> {
    try {
      this.logger.warn(
        `CDN purge job ${jobKey} — invalidating /${CdnFlagPurgeQueueService.PURGE_PREFIX}/*`
      );
      const result = await this.cdnPurgeService.purgePrefix(CdnFlagPurgeQueueService.PURGE_PREFIX);
      this.logger.warn(`CDN purge job ${jobKey} complete (${result.purged} path(s) submitted)`);
    } catch (error) {
      this.logger.error(`CDN purge job ${jobKey} failed: ${(error as Error).message}`);
    }
  }
}
