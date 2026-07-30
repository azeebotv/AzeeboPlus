import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UploadService } from '../upload/upload.service';
import { S3Service } from '../upload/s3.service';
import { RedisService } from '@azeebo/shared-services';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @Inject(UploadService) private readonly uploadService: UploadService,
    @Inject(S3Service) _s3Service: S3Service,
    @Inject(RedisService) private readonly redisService: RedisService
  ) {}

  async getStats() {
    try {
      const pendingJobs = await this.uploadService.listTranscodingJobs('pending');
      const processingJobs = await this.uploadService.listTranscodingJobs('processing');
      const failedJobs = await this.uploadService.listTranscodingJobs('failed');

      const bytesUsed = await this.redisService.get('media:total_storage_bytes');
      const totalStorage = bytesUsed ? parseInt(bytesUsed, 10) : 0;

      const bandwidthBytes = await this.redisService.get('media:bandwidth_bytes');
      const bandwidthUsage = bandwidthBytes ? parseInt(bandwidthBytes, 10) : 0;

      const uploadCountStr = await this.redisService.get('media:upload_count');
      const uploadCount = uploadCountStr ? parseInt(uploadCountStr, 10) : 0;

      return {
        uploadCount,
        totalStorageBytes: totalStorage,
        bandwidthUsageBytes: bandwidthUsage,
        pendingTranscodes: pendingJobs.length,
        processingTranscodes: processingJobs.length,
        failedTranscodes: failedJobs.length,
      };
    } catch (error) {
      this.logger.error('Failed to get media admin stats', (error as Error).stack);
      throw error;
    }
  }

  async getUploads(options?: { page?: number; limit?: number }) {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const skip = (page - 1) * limit;

      const uploadKeys = await this.redisService.scanKeys('media:upload:*');
      const total = uploadKeys.length;

      const paginatedKeys = uploadKeys.slice(skip, skip + limit);
      const uploads: Record<string, unknown>[] = [];

      for (const key of paginatedKeys) {
        const data = await this.redisService.get(key);
        if (data) {
          uploads.push({ id: key.replace('media:upload:', ''), ...JSON.parse(data) });
        }
      }

      return {
        uploads,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error('Failed to get uploads', (error as Error).stack);
      throw error;
    }
  }

  async deleteUpload(id: string) {
    try {
      const key = `media:upload:${id}`;
      const data = await this.redisService.get(key);
      if (!data) {
        throw new NotFoundException('Upload not found');
      }

      const upload = JSON.parse(data);
      if (upload.key) {
        await this.uploadService.deleteFile(upload.key);
      }

      await this.redisService.del(key);

      const countStr = await this.redisService.get('media:upload_count');
      const count = countStr ? parseInt(countStr, 10) : 0;
      if (count > 0) {
        await this.redisService.set('media:upload_count', String(count - 1));
      }

      return { message: 'Upload deleted successfully', id };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to delete upload ${id}`, (error as Error).stack);
      throw error;
    }
  }
}
