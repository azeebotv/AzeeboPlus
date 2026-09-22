import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { MediaClientService } from '../api/clients/media-client.service';

export interface SweepResult {
  /** Archived items older than the TTL that were examined. */
  scanned: number;
  /** Items whose stored objects were purged this pass. */
  purged: number;
  /** Items with nothing left to purge (metadata-only, or no stored keys). */
  nothingStored: number;
  /** Items skipped because media-service refused/unreachable — retried next pass. */
  deferred: number;
  /** Items whose objects were confirmed absent — marked purged without a call. */
  alreadyGone: number;
}

/**
 * Hard-delete sweeper for archived content.
 *
 * Portal "delete" archives a content item and immediately removes its stored
 * blob objects (best-effort). But that first pass can miss: media-service
 * unreachable, delete refused, or legacy rows archived before any cleanup
 * existed. Either way, archived items have historically kept consuming blob
 * storage forever — the orphan audit only sees *unreferenced* objects, and a
 * re-hydrated item can even restore the reference.
 *
 * This sweeper closes the loop with a permanent second pass: any item archived
 * longer than ARCHIVED_HARD_DELETE_TTL_DAYS (default 30) gets its stored
 * objects (metadata.media.key + metadata.media.derivedKey) deleted via
 * media-service, then is stamped mediaPurgedAt so it is never visited twice.
 *
 * Idempotency: mediaPurgedAt IS NOT NULL is the single "done" marker — set
 * only after a confirmed delete/absence, so a crashed pass never loses an
 * item; it is simply re-picked next run (media DELETE is idempotent and the
 * confirmed-absent outcome also counts as done).
 *
 * Failures never throw out of sweep(): the timer path treats a bad pass like
 * any other — log, defer, try again next interval.
 */
@Injectable()
export class ArchivedContentSweeperService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ArchivedContentSweeperService.name);
  private static readonly DEFAULT_TTL_DAYS = 30;
  private static readonly DEFAULT_INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6h
  private static readonly BATCH_SIZE = 50;

  private timer?: ReturnType<typeof setInterval>;
  private running = false;

  constructor(
    // Explicit @Inject tokens: the portal compiles without design:paramtypes
    // metadata, so bare class params resolve to undefined at runtime.
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(MediaClientService) private readonly mediaClient: MediaClientService,
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {}

  onModuleInit(): void {
    const intervalMs = this.configService.get<number>(
      'ARCHIVED_SWEEP_INTERVAL_MS',
      ArchivedContentSweeperService.DEFAULT_INTERVAL_MS
    );
    if (intervalMs <= 0) {
      this.logger.log('Archived-content sweeper disabled (ARCHIVED_SWEEP_INTERVAL_MS <= 0)');
      return;
    }
    this.timer = setInterval(() => void this.sweep(), intervalMs);
    // Never hold the process open on the sweeper's account.
    this.timer.unref?.();
    this.logger.log(
      `Archived-content sweeper armed: interval ${Math.round(intervalMs / 1000)}s, TTL ${this.ttlDays}d`
    );
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private get ttlDays(): number {
    const raw = Number(
      this.configService.get<string>('ARCHIVED_HARD_DELETE_TTL_DAYS')
    );
    return Number.isFinite(raw) && raw > 0
      ? raw
      : ArchivedContentSweeperService.DEFAULT_TTL_DAYS;
  }

  /**
   * Runs one sweep pass. Also exposed via an admin-triggered route so ops can
   * run it on demand (e.g. after a storage-cost review).
   */
  async sweep(): Promise<SweepResult> {
    if (this.running) {
      this.logger.warn('Sweep already in progress — skipping overlapping run');
      return { scanned: 0, purged: 0, nothingStored: 0, deferred: 0, alreadyGone: 0 };
    }
    this.running = true;
    try {
      return await this.runPass();
    } finally {
      this.running = false;
    }
  }

  private async runPass(): Promise<SweepResult> {
    const result: SweepResult = {
      scanned: 0,
      purged: 0,
      nothingStored: 0,
      deferred: 0,
      alreadyGone: 0,
    };
    const cutoff = new Date(Date.now() - this.ttlDays * 24 * 60 * 60 * 1000);

    // Batched: never load the whole archived set into memory. Items whose
    // purge fails stay archivedAt-old, so they naturally re-appear next pass.
    for (;;) {
      const items = await this.prisma.contentItem.findMany({
        where: {
          status: 'archived',
          archivedAt: { lte: cutoff, not: null },
          mediaPurgedAt: null,
        },
        orderBy: { archivedAt: 'asc' },
        take: ArchivedContentSweeperService.BATCH_SIZE,
        select: { id: true, title: true, metadata: true },
      });
      if (items.length === 0) break;

      for (const item of items) {
        result.scanned += 1;
        const outcome = await this.purgeItem(item);
        switch (outcome) {
          case 'purged':
            result.purged += 1;
            break;
          case 'already-gone':
            result.alreadyGone += 1;
            break;
          case 'nothing-stored':
            result.nothingStored += 1;
            break;
          case 'deferred':
            result.deferred += 1;
            break;
        }
      }

      // A pass that only deferred must not spin forever on the same batch:
      // break when nothing progressed. Deferred items remain eligible and are
      // retried on the next scheduled pass.
      if (result.purged + result.alreadyGone + result.nothingStored === 0) break;
    }

    if (result.scanned > 0) {
      this.logger.log(
        `Archived-content sweep: scanned=${result.scanned} purged=${result.purged} ` +
          `alreadyGone=${result.alreadyGone} nothingStored=${result.nothingStored} deferred=${result.deferred}`
      );
    }
    return result;
  }

  private async purgeItem(item: {
    id: string;
    title: string;
    metadata: unknown;
  }): Promise<'purged' | 'already-gone' | 'nothing-stored' | 'deferred'> {
    const meta = (item.metadata ?? {}) as {
      media?: { key?: string; derivedKey?: string };
    };
    const keys = [meta.media?.key, meta.media?.derivedKey].filter(
      (k): k is string => typeof k === 'string' && k.length > 0
    );

    if (keys.length === 0) {
      // Metadata-only item: nothing stored, but stamp it so it never gets
      // re-scanned by future passes.
      await this.prisma.contentItem.update({
        where: { id: item.id },
        data: { mediaPurgedAt: new Date() },
      });
      return 'nothing-stored';
    }

    const outcomes = await Promise.all(
      keys.map((key) => this.mediaClient.deleteObject(key))
    );

    // null = media-service unreachable/refused → defer, retry next pass.
    if (outcomes.some((o) => o === null)) {
      this.logger.warn(
        `content ${item.id} ("${item.title}"): media-service did not confirm delete — deferred to next sweep`
      );
      return 'deferred';
    }

    // All keys confirmed deleted or absent → done, permanently.
    await this.prisma.contentItem.update({
      where: { id: item.id },
      data: { mediaPurgedAt: new Date() },
    });
    const deletedCount = outcomes.filter((o) => o === 'deleted').length;
    this.logger.log(
      `content ${item.id} ("${item.title}"): hard-deleted ${deletedCount}/${keys.length} stored object(s) ` +
        `(archived > ${this.ttlDays}d)`
    );
    return deletedCount > 0 ? 'purged' : 'already-gone';
  }
}
