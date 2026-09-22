import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Service } from '../upload/s3.service.js';
import { BlobReconcileService } from './blob-reconcile.service.js';

export interface SweepResult {
  scanned: number;
  deleted: { key: string; size: number; ageHours: number }[];
  protectedYoung: number;
  protectedReferenced: number;
  protectedUnmanaged: number;
  errors: { key: string; reason: string }[];
}

/**
 * TTL sweeper for failed uploads.
 *
 * An upload that dies after "object written to storage" but before its
 * media_uploads row commits (crash, OOM, virus-scan reject, killed worker)
 * leaves a fully-stored, unreferenced object. The reconcile pass re-links
 * fresh ones; this sweeper deletes the ones nobody came back for.
 *
 * Deletion rules (all must hold):
 *   1. age ≥ TTL (MEDIA_UPLOAD_TTL_HOURS, default 24h) — measured from the
 *      object's LastModified, not from sweeper start, so restarts never
 *      inflate age.
 *   2. no media_uploads reference — key match or any embedded uuid (the same
 *      containment rule find-orphan-blobs.mjs uses, so the audit and the
 *      sweeper can never disagree about what is referenced).
 *   3. uuid-keyed — every uploader mints `folder/<uuid>.<ext>`; a key without
 *      a leading uuid is not something this service created (marker files,
 *      hand-seeded fixtures), so it is left for human review.
 *
 * Everything else is explicitly protected: young orphans inside the TTL
 * window are reconcile's job; referenced objects are live data; unmanaged
 * keys are unknown provenance. Chunks under uploads/chunks/ are excluded:
 * in-flight sessions are cleaned by completeChunkedUpload's finally block,
 * and abandoned sessions' chunks are ordinary uuid-keyed orphans only until
 * their redis TTL lapses — sweep still reclaims them via rule 1+2 once the
 * session is gone and they age past the TTL.
 */
@Injectable()
export class UploadTtlSweeperService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(UploadTtlSweeperService.name);
  private static readonly DEFAULT_TTL_HOURS = 24;
  private static readonly DEFAULT_INTERVAL_MS = 60 * 60 * 1000; // hourly
  /** Chunked-upload staging area — sessions/objects under this prefix. */
  private static readonly CHUNK_STAGING_PREFIX = 'uploads/chunks/';

  private timer?: ReturnType<typeof setInterval>;
  private running = false;

  constructor(
    private readonly s3Service: S3Service,
    private readonly reconcileService: BlobReconcileService,
    private readonly configService: ConfigService
  ) {}

  onModuleInit() {
    const intervalMs =
      this.configService.get<number>('MEDIA_UPLOAD_SWEEP_INTERVAL_MS') ??
      UploadTtlSweeperService.DEFAULT_INTERVAL_MS;
    const safeIntervalMs =
      Number.isFinite(intervalMs) && intervalMs > 0
        ? intervalMs
        : UploadTtlSweeperService.DEFAULT_INTERVAL_MS;

    this.timer = setInterval(() => void this.sweep(), safeIntervalMs);
    // Do not hold the process open just for the sweeper (dev/test hygiene).
    if (this.timer) {
      (this.timer as unknown as NodeJS.Timeout).unref();
    }
    this.logger.log(
      `Upload TTL sweeper armed: interval ${Math.round(safeIntervalMs / 1000)}s, ` +
        `TTL ${this.ttlHours()}h`
    );
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private ttlHours(): number {
    const h = this.configService.get<number>('MEDIA_UPLOAD_TTL_HOURS') ??
      UploadTtlSweeperService.DEFAULT_TTL_HOURS;
    return Number.isFinite(h) && h > 0 ? h : UploadTtlSweeperService.DEFAULT_TTL_HOURS;
  }

  async sweep(): Promise<SweepResult> {
    if (this.running) {
      // Overlap guard: a slow pass must not double-delete against itself.
      return {
        scanned: 0,
        deleted: [],
        protectedYoung: 0,
        protectedReferenced: 0,
        protectedUnmanaged: 0,
        errors: [{ key: '*', reason: 'sweep already running' }],
      };
    }
    this.running = true;
    try {
      return await this.runSweep();
    } finally {
      this.running = false;
    }
  }

  private async runSweep(): Promise<SweepResult> {
    const ttlHours = this.ttlHours();
    const cutoff = Date.now() - ttlHours * 3600 * 1000;
    const result: SweepResult = {
      scanned: 0,
      deleted: [],
      protectedYoung: 0,
      protectedReferenced: 0,
      protectedUnmanaged: 0,
      errors: [],
    };

    let objects: { Key?: string; Size?: number; LastModified?: Date }[];
    try {
      objects = await this.s3Service.listAllObjects();
    } catch (error) {
      // Bucket unreachable — report and exit; nothing is deleted on doubt.
      result.errors.push({ key: '*', reason: `list failed: ${(error as Error).message}` });
      return result;
    }
    result.scanned = objects.length;

    const referenced = await this.reconcileService.collectReferences();

    for (const obj of objects) {
      const key = obj.Key;
      if (!key) continue;

      const stem = this.stemOf(key);
      if (!stem) {
        result.protectedUnmanaged++;
        continue;
      }
      if (referenced.has(key) || referenced.has(stem) || [...referenced].some((r) => r.includes(stem))) {
        result.protectedReferenced++;
        continue;
      }

      const lastModified = obj.LastModified?.getTime() ?? 0;
      if (lastModified > cutoff) {
        result.protectedYoung++;
        continue;
      }

      const ageHours = Math.round(((Date.now() - lastModified) / 3600 / 1000) * 10) / 10;
      try {
        await this.s3Service.deleteFile(key);
        result.deleted.push({ key, size: obj.Size ?? 0, ageHours });
        this.logger.log(`Swept expired unreferenced upload: ${key} (${ageHours}h old)`);
      } catch (error) {
        result.errors.push({ key, reason: (error as Error).message.split('\n')[0] });
      }
    }

    if (result.deleted.length > 0 || result.errors.length > 0) {
      this.logger.log(
        `Sweep done: scanned ${result.scanned}, deleted ${result.deleted.length}, ` +
          `young ${result.protectedYoung}, referenced ${result.protectedReferenced}, ` +
          `unmanaged ${result.protectedUnmanaged}, errors ${result.errors.length}`
      );
    }
    return result;
  }

  private stemOf(key: string): string | null {
    // Chunk staging (uploads/chunks/<session-uuid>/<index>): the object's own
    // basename is a bare chunk index, so take the uuid from the parent dir —
    // that's the session the chunk belongs to.
    if (key.startsWith(UploadTtlSweeperService.CHUNK_STAGING_PREFIX)) {
      const parts = key.split('/');
      if (parts.length >= 3 && /^[0-9a-f-]{36}$/i.test(parts[2])) return parts[2].toLowerCase();
      return null;
    }
    const base = key.includes('/') ? key.slice(key.lastIndexOf('/') + 1) : key;
    const m = base.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
    return m ? m[1] : null;
  }
}
