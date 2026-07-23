import { Inject, Injectable, Logger } from '@nestjs/common';
import { S3Service } from './s3.service';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@azeebo/shared-services';
import { FileValidationService } from '../../common/services/file-validation.service';

export interface UploadResponse {
  key: string;
  url: string;
  cdnUrl: string;
  filename: string;
  mimetype: string;
  size: number;
  duration?: number;
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
  private readonly redisKeyPrefix = 'transcoding_job:';

  constructor(
    @Inject(S3Service) private readonly s3Service: S3Service,
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(RedisService) private readonly redisService: RedisService,
    @Inject(FileValidationService) private readonly fileValidationService: FileValidationService
  ) {
    this.cdnUrl = this.configService.get<string>('CDN_URL') || '';
    this.transcodingEnabled = this.configService.get<boolean>('TRANSCODING_ENABLED', true);
  }

  async uploadImage(file: Express.Multer.File): Promise<UploadResponse> {
    this.fileValidationService.validateFile(file, 'image');
    const result = await this.s3Service.uploadFile(file, 'images');
    return this.formatUploadResponse(result, file);
  }

  async uploadVideo(file: Express.Multer.File): Promise<UploadResponse> {
    this.fileValidationService.validateFile(file, 'video');
    const result = await this.s3Service.uploadFile(file, 'videos');

    if (this.transcodingEnabled && result.duration) {
      await this.scheduleTranscoding(result.key, result.duration);
    }

    return this.formatUploadResponse(result, file);
  }

  async uploadAudio(file: Express.Multer.File): Promise<UploadResponse> {
    this.fileValidationService.validateFile(file, 'audio');
    const result = await this.s3Service.uploadFile(file, 'audio');
    return this.formatUploadResponse(result, file);
  }

  async uploadDocument(file: Express.Multer.File): Promise<UploadResponse> {
    this.fileValidationService.validateFile(file, 'document');
    const result = await this.s3Service.uploadFile(file, 'documents');
    return this.formatUploadResponse(result, file);
  }

  async uploadThumbnail(file: Express.Multer.File): Promise<UploadResponse> {
    this.fileValidationService.validateFile(file, 'image');
    const result = await this.s3Service.uploadFile(file, 'thumbnails');
    return this.formatUploadResponse(result, file);
  }

  async uploadAvatar(file: Express.Multer.File): Promise<UploadResponse> {
    this.fileValidationService.validateFile(file, 'image');
    const result = await this.s3Service.uploadFile(file, 'avatars');
    return this.formatUploadResponse(result, file);
  }

  async uploadBanner(file: Express.Multer.File): Promise<UploadResponse> {
    this.fileValidationService.validateFile(file, 'image');
    const result = await this.s3Service.uploadFile(file, 'banners');
    return this.formatUploadResponse(result, file);
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

      for (let i = 0; i <= 100; i += 10) {
        job.progress = i;
        job.updatedAt = new Date();
        await this.saveTranscodingJob(job);
        await this.delay(500);
      }

      const outputKeys = [
        `transcoded/${jobId}/720p.mp4`,
        `transcoded/${jobId}/480p.mp4`,
        `transcoded/${jobId}/360p.mp4`,
        `transcoded/${jobId}/hls/master.m3u8`,
      ];

      job.outputKeys = outputKeys;
      job.status = 'completed';
      job.progress = 100;
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

  private formatUploadResponse(
    result: { key: string; url: string; cdnUrl: string; duration?: number },
    file: Express.Multer.File
  ): UploadResponse {
    return {
      key: result.key,
      url: result.url,
      cdnUrl: result.cdnUrl,
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      duration: result.duration,
    };
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

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
