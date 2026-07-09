import { Injectable, NotFoundException } from '@nestjs/common';
import { UploadService } from '../upload/upload.service';
import { S3Service } from '../upload/s3.service';
import { RedisService } from '../../common/services/redis.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly uploadService: UploadService,
    private readonly s3Service: S3Service,
    private readonly redisService: RedisService
  ) {}

  async getStats() {
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
  }

  async getUploads(options?: { page?: number; limit?: number }) {
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
  }

  async deleteUpload(id: string) {
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
  }
}
