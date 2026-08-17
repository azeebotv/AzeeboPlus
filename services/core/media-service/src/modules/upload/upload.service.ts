import {
  Inject,
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { S3Service } from './s3.service';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@azeebo/shared-services';
import { FeatureFlagService, mediaFlags } from '@azeebo/feature-flags';
import { FileValidationService } from '../../common/services/file-validation.service';
import { CdnPurgeService } from './cdn-purge.service';
import axios from 'axios';

/** Per-content-type CDN cache TTL keys (MEDIA_CACHE_TTL_* env vars). */
type CacheTtlType = 'image' | 'video' | 'audio' | 'document' | 'default';

/**
 * Typed caching behavior of the resolved Cache-Control directive, so clients
 * can switch without parsing the header string:
 * - `no-store` — media_cdn_edge_cache off; the CDN must not cache the asset.
 * - `immutable` — content-addressed image; safe to cache without revalidation
 *   (the directive carries `, immutable` regardless of the tuned TTL).
 * - `long-lived` — resolved max-age ≥ 7 days.
 * - `medium-lived` — resolved max-age ≥ 1 day.
 * - `short-lived` — resolved max-age < 1 day (re-encoded/replaced often).
 */
export type UploadCachePolicy =
  | 'no-store'
  | 'immutable'
  | 'long-lived'
  | 'medium-lived'
  | 'short-lived';

export interface UploadResponse {
  key: string;
  url: string;
  cdnUrl: string;
  filename: string;
  mimetype: string;
  size: number;
  duration?: number;
  /** CDN Cache-Control directive for the uploaded object (media_cdn_edge_cache). */
  cacheControl: string;
  /** Typed caching behavior of `cacheControl` (see UploadCachePolicy). */
  cachePolicy: UploadCachePolicy;
  /** Present ('clean') when media_virus_scan is on and the scan passed. */
  scanStatus?: 'clean';
}

export interface PresignedUploadResponse {
  uploadUrl: string;
  key: string;
  cdnUrl: string;
  expiresIn: number;
}

export interface TranscodingJob {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  outputKeys: string[];
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly cdnUrl: string;
  private readonly transcodingEnabled: boolean;
  private readonly analyticsServiceBaseUrl: string;
  private readonly redisKeyPrefix = 'transcoding_job:';

  constructor(
    @Inject(S3Service) private readonly s3Service: S3Service,
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(RedisService) private readonly redisService: RedisService,
    @Inject(FileValidationService) private readonly fileValidationService: FileValidationService,
    @Inject(FeatureFlagService) private readonly featureFlagService: FeatureFlagService,
    @Inject(CdnPurgeService) private readonly cdnPurgeService: CdnPurgeService
  ) {
    this.cdnUrl = this.configService.get<string>('CDN_URL') || '';
    this.transcodingEnabled = this.configService.get<boolean>('TRANSCODING_ENABLED', true);
    this.analyticsServiceBaseUrl =
      this.configService.get<string>('ANALYTICS_SERVICE_URL') ?? 'http://analytics-service:3008';
    this.cacheTtlSeconds = {
      image: this.readCacheTtlSeconds('MEDIA_CACHE_TTL_IMAGE', 31_536_000),
      video: this.readCacheTtlSeconds('MEDIA_CACHE_TTL_VIDEO', 86_400),
      audio: this.readCacheTtlSeconds('MEDIA_CACHE_TTL_AUDIO', 604_800),
      document: this.readCacheTtlSeconds('MEDIA_CACHE_TTL_DOCUMENT', 604_800),
      default: this.readCacheTtlSeconds('MEDIA_CACHE_TTL_DEFAULT', 3_600),
    };
  }

  /** Reads a per-type CDN cache TTL (seconds) from env, falling back to the
   * default when unset, non-numeric, or non-positive. */
  private readCacheTtlSeconds(envKey: string, fallback: number): number {
    const raw = this.configService.get<string | number>(envKey, fallback);
    const parsed = typeof raw === 'number' ? raw : Number.parseInt(String(raw), 10);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
  }

  async uploadImage(file: Express.Multer.File, userId?: string): Promise<UploadResponse> {
    this.fileValidationService.validateFile(file, 'image');
    const result = await this.s3Service.uploadFile(file, 'images');
    const scanStatus = await this.scanUploadIfEnabled(result.key, file.mimetype);
    return this.formatUploadResponse(result, file, { userId, uploadType: 'image', scanStatus });
  }

  async uploadVideo(file: Express.Multer.File, userId?: string): Promise<UploadResponse> {
    this.fileValidationService.validateFile(file, 'video');
    const result = await this.s3Service.uploadFile(file, 'videos');
    const scanStatus = await this.scanUploadIfEnabled(result.key, file.mimetype);

    if (this.transcodingEnabled && result.duration) {
      await this.scheduleTranscoding(result.key, result.duration);
    }

    return this.formatUploadResponse(result, file, { userId, uploadType: 'video', scanStatus });
  }

  async uploadAudio(file: Express.Multer.File, userId?: string): Promise<UploadResponse> {
    this.fileValidationService.validateFile(file, 'audio');
    const result = await this.s3Service.uploadFile(file, 'audio');
    const scanStatus = await this.scanUploadIfEnabled(result.key, file.mimetype);
    return this.formatUploadResponse(result, file, { userId, uploadType: 'audio', scanStatus });
  }

  async uploadDocument(file: Express.Multer.File, userId?: string): Promise<UploadResponse> {
    this.fileValidationService.validateFile(file, 'document');
    const result = await this.s3Service.uploadFile(file, 'documents');
    const scanStatus = await this.scanUploadIfEnabled(result.key, file.mimetype);
    return this.formatUploadResponse(result, file, { userId, uploadType: 'document', scanStatus });
  }

  async uploadThumbnail(file: Express.Multer.File, userId?: string): Promise<UploadResponse> {
    this.fileValidationService.validateFile(file, 'image');
    const result = await this.s3Service.uploadFile(file, 'thumbnails');
    const scanStatus = await this.scanUploadIfEnabled(result.key, file.mimetype);
    return this.formatUploadResponse(result, file, { userId, uploadType: 'thumbnail', scanStatus });
  }

  async uploadAvatar(file: Express.Multer.File, userId?: string): Promise<UploadResponse> {
    this.fileValidationService.validateFile(file, 'image');
    const result = await this.s3Service.uploadFile(file, 'avatars');
    const scanStatus = await this.scanUploadIfEnabled(result.key, file.mimetype);
    return this.formatUploadResponse(result, file, { userId, uploadType: 'avatar', scanStatus });
  }

  async uploadBanner(file: Express.Multer.File, userId?: string): Promise<UploadResponse> {
    this.fileValidationService.validateFile(file, 'image');
    const result = await this.s3Service.uploadFile(file, 'banners');
    const scanStatus = await this.scanUploadIfEnabled(result.key, file.mimetype);
    return this.formatUploadResponse(result, file, { userId, uploadType: 'banner', scanStatus });
  }

  // ─── Chunked / resumable upload (media_upload_chunked) ───────────────

  private static readonly CHUNKED_UPLOAD_PREFIX = 'chunked_upload:';
  private static readonly CHUNK_STAGING_PREFIX = 'uploads/chunks/';
  private static readonly CHUNKED_UPLOAD_TTL_SECONDS = 24 * 3600;
  private static readonly MAX_CHUNK_BYTES = 10 * 1024 * 1024;

  async initChunkedUpload(
    dto: { filename: string; contentType: string; totalChunks: number; uploadType: string },
    userId?: string
  ): Promise<{ uploadId: string; chunkSize: number; totalChunks: number; expiresAt: string }> {
    if (!(await this.featureFlagService.isEnabled(mediaFlags.uploadChunked))) {
      throw new ForbiddenException('Chunked uploads are not enabled');
    }

    const uploadId = randomUUID();
    const session = {
      userId: userId ?? null,
      filename: dto.filename,
      contentType: dto.contentType,
      totalChunks: dto.totalChunks,
      uploadType: dto.uploadType,
      received: [] as number[],
      createdAt: Date.now(),
    };

    await this.redisService.set(
      `${UploadService.CHUNKED_UPLOAD_PREFIX}${uploadId}`,
      JSON.stringify(session),
      UploadService.CHUNKED_UPLOAD_TTL_SECONDS
    );

    return {
      uploadId,
      chunkSize: UploadService.MAX_CHUNK_BYTES,
      totalChunks: dto.totalChunks,
      expiresAt: new Date(
        Date.now() + UploadService.CHUNKED_UPLOAD_TTL_SECONDS * 1000
      ).toISOString(),
    };
  }

  async uploadChunk(
    uploadId: string,
    index: number,
    file: Express.Multer.File
  ): Promise<{ uploadId: string; received: number; totalChunks: number }> {
    if (!(await this.featureFlagService.isEnabled(mediaFlags.uploadChunked))) {
      throw new ForbiddenException('Chunked uploads are not enabled');
    }

    const session = await this.getChunkedSession(uploadId);
    if (!Number.isInteger(index) || index < 0 || index >= session.totalChunks) {
      throw new BadRequestException(
        `Chunk index ${index} out of range (0-${session.totalChunks - 1})`
      );
    }
    if (session.received.includes(index)) {
      throw new BadRequestException(`Chunk ${index} already uploaded`);
    }
    if (!file || file.size === 0 || file.size > UploadService.MAX_CHUNK_BYTES) {
      throw new BadRequestException(
        `Chunk must be between 1 byte and ${UploadService.MAX_CHUNK_BYTES / 1024 / 1024}MB`
      );
    }

    const key = `${UploadService.CHUNK_STAGING_PREFIX}${uploadId}/${index}`;
    await this.s3Service.putBuffer(key, file.buffer, file.mimetype);

    session.received.push(index);
    await this.redisService.set(
      `${UploadService.CHUNKED_UPLOAD_PREFIX}${uploadId}`,
      JSON.stringify(session),
      UploadService.CHUNKED_UPLOAD_TTL_SECONDS
    );

    return {
      uploadId,
      received: session.received.length,
      totalChunks: session.totalChunks,
    };
  }

  async completeChunkedUpload(uploadId: string): Promise<UploadResponse> {
    if (!(await this.featureFlagService.isEnabled(mediaFlags.uploadChunked))) {
      throw new ForbiddenException('Chunked uploads are not enabled');
    }

    const session = await this.getChunkedSession(uploadId);
    if (session.received.length !== session.totalChunks) {
      throw new BadRequestException(
        `Incomplete upload: ${session.received.length}/${session.totalChunks} chunks received`
      );
    }

    // Reassemble in order, then run through the same validated upload path as
    // a single-shot upload (sniffing, size caps, transcoding, cache policy).
    const buffers: Buffer[] = [];
    for (let i = 0; i < session.totalChunks; i++) {
      const chunk = await this.s3Service.getObjectBuffer(
        `${UploadService.CHUNK_STAGING_PREFIX}${uploadId}/${i}`
      );
      buffers.push(chunk);
    }
    const assembled = Buffer.concat(buffers);
    const file = {
      buffer: assembled,
      mimetype: session.contentType,
      originalname: session.filename,
      size: assembled.length,
      fieldname: 'file',
      encoding: '7bit',
      destination: '',
      filename: session.filename,
      path: '',
    } as Express.Multer.File;

    try {
      const uploadType = session.uploadType;
      const dispatch: Record<
        string,
        (f: Express.Multer.File, u?: string) => Promise<UploadResponse>
      > = {
        image: (f, u) => this.uploadImage(f, u),
        video: (f, u) => this.uploadVideo(f, u),
        audio: (f, u) => this.uploadAudio(f, u),
        document: (f, u) => this.uploadDocument(f, u),
      };
      const handler = dispatch[uploadType];
      if (!handler) {
        throw new BadRequestException(`Unsupported upload type: ${uploadType}`);
      }
      return await handler(file, session.userId ?? undefined);
    } finally {
      // Best-effort cleanup of the staged chunks + session.
      await this.cleanupChunkedUpload(uploadId, session.totalChunks);
    }
  }

  private async getChunkedSession(uploadId: string): Promise<{
    userId: string | null;
    filename: string;
    contentType: string;
    totalChunks: number;
    uploadType: string;
    received: number[];
    createdAt: number;
  }> {
    const raw = await this.redisService.get(`${UploadService.CHUNKED_UPLOAD_PREFIX}${uploadId}`);
    if (!raw) {
      throw new BadRequestException('Upload session not found or expired');
    }
    try {
      return JSON.parse(raw);
    } catch {
      throw new BadRequestException('Upload session is corrupt');
    }
  }

  private async cleanupChunkedUpload(uploadId: string, totalChunks: number): Promise<void> {
    try {
      const keys = Array.from(
        { length: totalChunks },
        (_, i) => `${UploadService.CHUNK_STAGING_PREFIX}${uploadId}/${i}`
      );
      await Promise.all(keys.map((key) => this.s3Service.deleteFile(key)));
    } catch (error) {
      this.logger.warn(
        `Failed to clean up chunked upload ${uploadId}: ${(error as Error).message}`
      );
    }
    await this.redisService.del(`${UploadService.CHUNKED_UPLOAD_PREFIX}${uploadId}`);
  }

  // ─── Virus scan hook (media_virus_scan) ──────────────────────────────

  /**
   * Upload scanning hook. While the flag is on every upload must pass a scan
   * against MEDIA_VIRUS_SCAN_URL (a scanner that POSTs back { clean: boolean })
   * before it is served — fail-closed: no scanner configured, scanner
   * unreachable, or a non-clean verdict all reject the upload.
   */
  private async scanUploadIfEnabled(key: string, mimetype: string): Promise<'clean' | undefined> {
    if (!(await this.featureFlagService.isEnabled(mediaFlags.virusScan))) {
      return undefined;
    }

    const scannerUrl = this.configService.get<string>('MEDIA_VIRUS_SCAN_URL');
    if (!scannerUrl) {
      throw new BadRequestException(
        'Virus scanning is enabled but no scanner is configured (MEDIA_VIRUS_SCAN_URL)'
      );
    }

    try {
      const response = await axios.post(
        `${scannerUrl}/scan`,
        { key, mimetype },
        { timeout: 30_000 }
      );
      const verdict = response.data?.clean === true;
      if (!verdict) {
        throw new BadRequestException('Upload failed virus scan');
      }
      return 'clean';
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Virus scan failed for ${key}: ${(error as Error).message}`);
      throw new BadRequestException('Upload could not be scanned. Please try again later.');
    }
  }

  async getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    return this.s3Service.getSignedDownloadUrl(key, expiresIn);
  }

  async getPresignedUploadUrl(
    type: 'image' | 'video' | 'audio' | 'document',
    fileId: string,
    extension: string,
    contentType: string,
    expiresIn = 3600
  ): Promise<PresignedUploadResponse> {
    this.fileValidationService.validatePresignedUpload(type, extension, contentType);

    const folder = this.getFolderForType(type);
    const key = this.s3Service.generateKey(folder, fileId, extension);
    const result = await this.s3Service.getSignedUploadUrl(key, contentType, expiresIn);

    const cdnUrl = this.cdnUrl ? `${this.cdnUrl}/${result.key}` : result.key;

    return {
      uploadUrl: result.uploadUrl,
      key: result.key,
      cdnUrl,
      expiresIn,
    };
  }

  async deleteFile(key: string): Promise<void> {
    await this.s3Service.deleteFile(key);
  }

  async getFileMetadata(key: string): Promise<{
    contentType: string | undefined;
    contentLength: number | undefined;
    lastModified: Date | undefined;
    metadata: Record<string, string> | undefined;
  }> {
    return this.s3Service.getFileMetadata(key);
  }

  async cleanupOrphanedFiles(prefix: string, olderThanDays: number): Promise<number> {
    return this.s3Service.cleanupOrphanedFiles(prefix, olderThanDays);
  }

  async cleanupAllOrphanedFiles(): Promise<{ [prefix: string]: number }> {
    const prefixes = [
      'uploads/',
      'images/',
      'videos/',
      'audio/',
      'documents/',
      'thumbnails/',
      'avatars/',
      'banners/',
    ];
    const results: { [prefix: string]: number } = {};

    for (const prefix of prefixes) {
      results[prefix] = await this.s3Service.cleanupOrphanedFiles(prefix, 30);
    }

    return results;
  }

  async retryFailedTranscodingJobs(): Promise<number> {
    let retriedCount = 0;
    const jobKeys = await this.redisService.scanKeys(`${this.redisKeyPrefix}*`);

    for (const key of jobKeys) {
      const jobData = await this.redisService.get(key);
      if (jobData) {
        const job: TranscodingJob = JSON.parse(jobData);
        if (job.status === 'failed') {
          this.logger.log(`Retrying failed transcoding job: ${job.jobId}`);
          job.status = 'pending';
          job.error = undefined;
          job.updatedAt = new Date();
          await this.saveTranscodingJob(job);
          await this.processTranscodingJob(job.jobId);
          retriedCount++;
        }
      }
    }

    return retriedCount;
  }

  private async saveTranscodingJob(job: TranscodingJob): Promise<void> {
    const key = `${this.redisKeyPrefix}${job.jobId}`;
    await this.redisService.set(key, JSON.stringify(job));
  }

  private async getTranscodingJob(jobId: string): Promise<TranscodingJob | null> {
    const key = `${this.redisKeyPrefix}${jobId}`;
    const jobData = await this.redisService.get(key);
    if (jobData) {
      return JSON.parse(jobData);
    }
    return null;
  }

  private async scheduleTranscoding(key: string, _duration: number): Promise<void> {
    // Kill-switch: skip enqueueing new transcoding jobs when disabled.
    if (!(await this.featureFlagService.isEnabled(mediaFlags.transcodeAv1))) {
      this.logger.warn(`Transcoding disabled by flag; skipping job for ${key}`);
      return;
    }

    const jobId = `transcode_${Date.now()}_${key.replace(/\//g, '_')}`;

    const job: TranscodingJob = {
      jobId,
      status: 'pending',
      progress: 0,
      outputKeys: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.saveTranscodingJob(job);

    setTimeout(() => {
      this.processTranscodingJob(jobId).catch((err) => {
        this.logger.error(`Failed to process transcoding job ${jobId}: ${(err as Error).message}`);
      });
    }, 1000);
  }

  private async processTranscodingJob(jobId: string): Promise<void> {
    const job = await this.getTranscodingJob(jobId);
    if (!job) return;

    try {
      job.status = 'processing';
      job.progress = 0;
      job.updatedAt = new Date();
      await this.saveTranscodingJob(job);

      // Delegate to external transcoding service if configured
      const transcodeServiceUrl = this.configService.get<string>('TRANSCODE_SERVICE_URL');
      if (transcodeServiceUrl) {
        const response = await axios.post(
          `${transcodeServiceUrl}/transcode`,
          {
            jobId,
            outputFormats: ['720p', '480p', '360p', 'hls'],
          },
          { timeout: 30000 }
        );

        const result = response.data;
        job.outputKeys = result.outputKeys || [
          `transcoded/${jobId}/720p.mp4`,
          `transcoded/${jobId}/480p.mp4`,
          `transcoded/${jobId}/360p.mp4`,
          `transcoded/${jobId}/hls/master.m3u8`,
        ];
        job.status = 'completed';
        job.progress = 100;
      } else {
        // Fallback: generate output keys based on job ID
        job.outputKeys = [
          `transcoded/${jobId}/720p.mp4`,
          `transcoded/${jobId}/480p.mp4`,
          `transcoded/${jobId}/360p.mp4`,
          `transcoded/${jobId}/hls/master.m3u8`,
        ];
        job.status = 'completed';
        job.progress = 100;
        this.logger.warn(
          `No TRANSCODE_SERVICE_URL configured — output keys generated but transcoding not performed`
        );
      }

      job.updatedAt = new Date();
      await this.saveTranscodingJob(job);

      this.logger.log(`Transcoding job ${jobId} completed successfully`);
    } catch (err) {
      const error = err as Error;
      job.status = 'failed';
      job.error = error.message;
      job.updatedAt = new Date();
      await this.saveTranscodingJob(job);
      this.logger.error(`Transcoding job ${jobId} failed: ${error.message}`);
    }
  }

  async getTranscodingJobStatus(jobId: string): Promise<TranscodingJob | null> {
    return this.getTranscodingJob(jobId);
  }

  async listTranscodingJobs(
    status?: 'pending' | 'processing' | 'completed' | 'failed'
  ): Promise<TranscodingJob[]> {
    const jobKeys = await this.redisService.scanKeys(`${this.redisKeyPrefix}*`);
    const jobs: TranscodingJob[] = [];

    for (const key of jobKeys) {
      const jobData = await this.redisService.get(key);
      if (jobData) {
        const job: TranscodingJob = JSON.parse(jobData);
        if (!status || job.status === status) {
          jobs.push(job);
        }
      }
    }

    return jobs;
  }

  // Per-content-type CDN cache TTLs in seconds, read from env in the
  // constructor (MEDIA_CACHE_TTL_IMAGE/VIDEO/AUDIO/DOCUMENT/DEFAULT). Images
  // are content-addressed S3 keys → immutable, year-long by default. Videos/
  // audio can be replaced by re-encodes or re-uploads, so they get shorter
  // TTLs to bound staleness. Anything unrecognized falls back to a
  // conservative 1h. Defaults mirror the previous hard-coded values.
  private readonly cacheTtlSeconds: Record<CacheTtlType, number>;

  // Policy bands for the resolved max-age (seconds). Anything at/above a band
  // boundary is labeled with that band; the label tracks the resolved TTL, so
  // tuning MEDIA_CACHE_TTL_* re-bands the policy automatically.
  private static readonly LONG_LIVED_TTL = 604_800; // 7 days
  private static readonly MEDIUM_LIVED_TTL = 86_400; // 1 day

  /**
   * Resolved CDN Cache-Control for upload responses, driven by
   * media_cdn_edge_cache and varied by content type (TTLs configurable via
   * MEDIA_CACHE_TTL_*). Returns the directive plus a typed policy for
   * clients. When the flag is off the CDN must not cache the asset at all.
   */
  private async resolveCacheControl(
    mimetype: string
  ): Promise<{ value: string; policy: UploadCachePolicy }> {
    if (!(await this.featureFlagService.isEnabled(mediaFlags.cdnEdgeCache))) {
      return { value: 'private, no-store', policy: 'no-store' };
    }
    if (mimetype.startsWith('image/')) {
      return {
        value: `public, max-age=${this.cacheTtlSeconds.image}, immutable`,
        policy: 'immutable',
      };
    }
    const ttl = this.cacheTtlSecondsFor(mimetype);
    return { value: `public, max-age=${ttl}`, policy: this.cachePolicyForTtl(ttl) };
  }

  /** Resolved TTL for a non-image mimetype (video/audio/document/default). */
  private cacheTtlSecondsFor(mimetype: string): number {
    if (mimetype.startsWith('video/')) return this.cacheTtlSeconds.video;
    if (mimetype.startsWith('audio/')) return this.cacheTtlSeconds.audio;
    if (mimetype.startsWith('application/')) return this.cacheTtlSeconds.document;
    return this.cacheTtlSeconds.default;
  }

  /** Band label for a resolved max-age (see UploadCachePolicy). */
  private cachePolicyForTtl(ttl: number): UploadCachePolicy {
    if (ttl >= UploadService.LONG_LIVED_TTL) return 'long-lived';
    if (ttl >= UploadService.MEDIUM_LIVED_TTL) return 'medium-lived';
    return 'short-lived';
  }

  private async formatUploadResponse(
    result: { key: string; url: string; cdnUrl: string; duration?: number },
    file: Express.Multer.File,
    meta: { userId?: string; uploadType: string; scanStatus?: 'clean' } = {
      uploadType: 'unknown',
    }
  ): Promise<UploadResponse> {
    const { value: cacheControl, policy: cachePolicy } = await this.resolveCacheControl(
      file.mimetype
    );

    // Caching disabled (media_cdn_edge_cache off): a re-upload of this key
    // must not be shadowed by a previously cached edge copy, so invalidate
    // exactly this key. The invalidation is best-effort and never blocks the
    // upload response.
    if (cachePolicy === 'no-store') {
      this.purgeKeyFromCdn(result.key);
    }

    // Emit one analytics event per upload, carrying the content type and the
    // applied cache directive — the raw material for CDN cache-budget
    // planning (per-type volumes × TTLs → expected cache residency).
    this.trackUploadAnalytics(
      {
        contentType: file.mimetype,
        uploadType: meta.uploadType,
        cacheControl,
        cachePolicy,
        sizeBytes: file.size,
        filename: file.originalname,
        key: result.key,
      },
      meta.userId
    );

    return {
      key: result.key,
      url: result.url,
      cdnUrl: result.cdnUrl,
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      duration: result.duration,
      cacheControl,
      cachePolicy,
      ...(meta.scanStatus ? { scanStatus: meta.scanStatus } : {}),
    };
  }

  /**
   * Best-effort CDN invalidation of a single object key (used when caching is
   * disabled, so a re-upload evicts any stale edge copy of that key). Never
   * throws — a failed purge must not fail the upload.
   */
  private async purgeKeyFromCdn(key: string): Promise<void> {
    if (!key) return;
    try {
      await this.cdnPurgeService.purgeKeys([key]);
    } catch (error) {
      this.logger.warn(`Failed to purge CDN key ${key}: ${(error as Error).message}`);
    }
  }

  /**
   * Best-effort analytics event for a completed upload (media_upload). Never
   * throws — a failed analytics POST must not fail the upload.
   */
  private async trackUploadAnalytics(
    metadata: Record<string, unknown>,
    userId?: string
  ): Promise<void> {
    try {
      await axios.post(
        `${this.analyticsServiceBaseUrl}/analytics/track`,
        {
          eventName: 'media_upload',
          userId,
          metadata,
          timestamp: new Date().toISOString(),
        },
        { timeout: 10000 }
      );
    } catch (error) {
      this.logger.warn(`Failed to track media_upload analytics event: ${(error as Error).message}`);
    }
  }

  private getFolderForType(type: string): string {
    const folders: Record<string, string> = {
      image: 'images',
      video: 'videos',
      audio: 'audio',
      document: 'documents',
    };
    return folders[type] || 'misc';
  }
}
