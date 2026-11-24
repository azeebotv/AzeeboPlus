import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { S3Service } from '../upload/s3.service.js';

export interface ReconcileResult {
  /** Objects that had no matching media_uploads row and got one inserted. */
  linked: {
    key: string;
    uploadId: string;
    size: number;
    lastModified: string;
  }[];
  /** Objects already referenced by a media_uploads row (by key or uuid stem). */
  alreadyLinked: number;
  /** Insert attempts that failed (reported, never fatal to the rest of the pass). */
  errors: { key: string; reason: string }[];
}

/**
 * Blob reconcile pass — closes the gap find-orphan-blobs.mjs only reports.
 *
 * An upload that dies between "object written to storage" and "row committed"
 * (crash, OOM, killed worker) leaves a fully-stored object that nothing
 * references: the weekly audit flags it as an orphan and a human decides.
 * This pass does the better thing when the object is *good* — it re-links it
 * by inserting the missing media_uploads row, marking the row
 * metadata.reconciled = true so operators can tell backfilled rows from
 * organic uploads (and so downstream tooling can re-verify scan state).
 *
 * Deletion is deliberately out of scope here: genuinely unwanted objects are
 * the audit script's --delete job after human review. Reconcile only adds.
 */
@Injectable()
export class BlobReconcileService {
  private readonly logger = new Logger(BlobReconcileService.name);
  /** Chunked-upload staging area — chunks are swept, never reconciled. */
  private static readonly CHUNK_STAGING_PREFIX = 'uploads/chunks/';

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service
  ) {}

  async reconcile(prefix?: string): Promise<ReconcileResult> {
    const objects = await this.s3Service.listAllObjects(prefix);
    // Partial chunked-upload chunks (uploads/chunks/<sessionId>/<index>) are
    // NOT content — backfilling them as rows would turn transient garbage
    // into permanent media_uploads entries. The TTL sweeper reclaims them.
    const real = objects.filter(
      (o) =>
        o.Key &&
        o.Key !== '' &&
        (o.Size ?? 0) > 0 &&
        !o.Key.startsWith(BlobReconcileService.CHUNK_STAGING_PREFIX)
    );

    // Existing references: the bare key plus any UUID embedded anywhere in
    // the reference (rows can store the key, a CDN URL, or a derived name —
    // matching mirrors find-orphan-blobs.mjs's containment rule).
    const referenced = await this.collectReferences();

    const result: ReconcileResult = { linked: [], alreadyLinked: 0, errors: [] };

    for (const obj of real) {
      const key = obj.Key as string;
      const stem = this.uuidStem(key);
      if (referenced.has(key) || (stem && referenced.has(stem))) {
        result.alreadyLinked++;
        continue;
      }
      // Reference strings may embed the object's uuid anywhere (cdn paths);
      // containment check covers those the set lookup can't pre-enumerate.
      if (stem && [...referenced].some((ref) => ref.includes(stem))) {
        result.alreadyLinked++;
        continue;
      }

      try {
        const created = await this.prisma.mediaUpload.create({
          data: {
            // No trustworthy owner can be derived from a bare object — the
            // system user marks the row as service-created, not user-uploaded.
            userId: 'system',
            fileName: key,
            originalName: this.basename(key),
            mimeType: this.mimeTypeFromKey(key),
            size: BigInt(obj.Size ?? 0),
            key,
            folder: key.includes('/') ? key.slice(0, key.lastIndexOf('/')) : 'uploads',
            status: 'uploaded',
            metadata: {
              reconciled: true,
              reconciledAt: new Date().toISOString(),
              reconciledSize: obj.Size ?? 0,
              reconciledLastModified: obj.LastModified?.toISOString?.() ?? null,
            },
          },
        });
        result.linked.push({
          key,
          uploadId: created.id,
          size: obj.Size ?? 0,
          lastModified: obj.LastModified?.toISOString?.() ?? new Date(0).toISOString(),
        });
        this.logger.log(`Reconciled orphaned blob into media_uploads: ${key}`);
      } catch (error) {
        result.errors.push({ key, reason: (error as Error).message.split('\n')[0] });
        this.logger.error(`Reconcile insert failed for ${key}: ${(error as Error).message}`);
      }
    }

    this.logger.log(
      `Reconcile pass: ${result.linked.length} linked, ${result.alreadyLinked} already linked, ${result.errors.length} errors`
    );
    return result;
  }

  /** 'videos/0f8d…-clip.mp4' → the uuid stem when the basename starts with one. */
  private uuidStem(key: string): string | null {
    const base = key.includes('/') ? key.slice(key.lastIndexOf('/') + 1) : key;
    const m = base.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
    return m ? m[1] : null;
  }

  /** Every uuid found anywhere in a reference string (lowercased, deduped). */
  extractUuids(reference: string): Set<string> {
    return new Set(
      [...reference.matchAll(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi)].map(
        (m) => m[0].toLowerCase()
      )
    );
  }

  /** All existing media_uploads references (keys + embedded uuids), for the sweeper. */
  async collectReferences(): Promise<Set<string>> {
    const rows = await this.prisma.mediaUpload.findMany({ select: { key: true } });
    const referenced = new Set<string>();
    for (const r of rows) {
      if (r.key) {
        referenced.add(r.key);
        for (const uuid of this.extractUuids(r.key)) referenced.add(uuid);
      }
    }
    return referenced;
  }

  private basename(key: string): string {
    return key.includes('/') ? key.slice(key.lastIndexOf('/') + 1) : key;
  }

  private mimeTypeFromKey(key: string): string {
    const ext =
      this.basename(key)
        .match(/\.([a-z0-9]+)$/i)?.[1]
        ?.toLowerCase() ?? '';
    const map: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
      mp4: 'video/mp4',
      webm: 'video/webm',
      mov: 'video/quicktime',
      mp3: 'audio/mpeg',
      aac: 'audio/aac',
      pdf: 'application/pdf',
    };
    return map[ext] ?? 'application/octet-stream';
  }
}
