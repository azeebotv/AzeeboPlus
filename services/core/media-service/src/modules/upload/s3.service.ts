import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { CircuitBreaker, CircuitBreakerOpenError, CircuitBreakerStats } from '@azeebo/shared-types';

interface FileMetadata {
  contentType: string | undefined;
  contentLength: number | undefined;
  lastModified: Date | undefined;
  metadata: Record<string, string> | undefined;
  duration?: number;
}

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private s3Client: S3Client;
  private bucketName: string;
  private cdnUrl: string;
  private region: string;
  private readonly circuitBreaker: CircuitBreaker;
  private readonly maxFileSizes: Record<string, number> = {
    'image/jpeg': 50 * 1024 * 1024,
    'image/png': 50 * 1024 * 1024,
    'image/webp': 50 * 1024 * 1024,
    'image/gif': 50 * 1024 * 1024,
    'video/mp4': 500 * 1024 * 1024,
    'video/webm': 500 * 1024 * 1024,
    'video/quicktime': 500 * 1024 * 1024,
    'audio/mpeg': 100 * 1024 * 1024,
    'audio/aac': 100 * 1024 * 1024,
    'application/pdf': 50 * 1024 * 1024,
  };

  private readonly allowedExtensions: Record<string, string[]> = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'image/gif': ['.gif'],
    'video/mp4': ['.mp4'],
    'video/webm': ['.webm'],
    'video/quicktime': ['.mov', '.qt'],
    'audio/mpeg': ['.mp3'],
    'audio/aac': ['.aac'],
    'application/pdf': ['.pdf'],
  };

  constructor(private configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET') || 'azeebo-media';
    this.cdnUrl = this.configService.get<string>('CDN_URL') || '';

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });

    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 60000,
      halfOpenRequests: 3,
    });

    this.logger.log('S3Service initialized with circuit breaker');
  }

  async uploadFile(
    file: Express.Multer.File,
    folder = 'uploads'
  ): Promise<{ key: string; url: string; cdnUrl: string; duration?: number }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const sniffedType = await this.sniffMimeType(file.buffer);
    const declaredType = file.mimetype;

    if (sniffedType && sniffedType !== declaredType) {
      this.logger.warn(`MIME type mismatch: declared=${declaredType}, sniffed=${sniffedType}`);
      throw new BadRequestException(
        `File type mismatch: expected ${declaredType}, got ${sniffedType}`
      );
    }

    const validatedType = sniffedType || declaredType;

    if (!this.isAllowedMimeType(validatedType)) {
      throw new BadRequestException(`File type ${validatedType} is not allowed`);
    }

    const maxFileSize = this.getMaxFileSize(validatedType);
    if (file.size > maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${maxFileSize / 1024 / 1024}MB`
      );
    }

    const fileExtension = this.getFileExtension(file.originalname);
    if (!this.isExtensionValid(validatedType, fileExtension)) {
      throw new BadRequestException(
        `File extension ${fileExtension} is not valid for ${validatedType}`
      );
    }

    const key = `${folder}/${randomUUID()}.${fileExtension}`;

    try {
      await this.circuitBreaker.execute(async () => {
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: file.buffer,
            ContentType: validatedType,
            Metadata: {
              'original-name': file.originalname,
              'content-length': file.size.toString(),
            },
          })
        );
      });
    } catch (error: unknown) {
      if (error instanceof CircuitBreakerOpenError) {
        this.logger.warn(`S3 circuit breaker open: ${error.message}`);
        throw new BadRequestException(
          'File upload service temporarily unavailable. Please try again later.'
        );
      }
      this.logger.error(`Error uploading file to S3: ${(error as Error).message}`);
      throw error;
    }

    const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
    const cdnUrl = this.cdnUrl ? `${this.cdnUrl}/${key}` : url;

    let duration: number | undefined;
    if (validatedType.startsWith('video/') || validatedType.startsWith('audio/')) {
      duration = await this.extractDuration(file.buffer, validatedType);
    }

    const maxDuration = this.getMaxDuration(validatedType);
    if (duration && duration > maxDuration) {
      await this.deleteFile(key);
      throw new BadRequestException(
        `File duration ${duration} seconds exceeds maximum allowed duration of ${maxDuration} seconds`
      );
    }

    return { key, url, cdnUrl, duration };
  }

  private async sniffMimeType(buffer: Buffer): Promise<string | undefined> {
    try {
      const { fileTypeFromBuffer } = await import('file-type');
      const result = await fileTypeFromBuffer(buffer);
      return result?.mime;
    } catch (error: unknown) {
      this.logger.warn(`Failed to sniff MIME type: ${(error as Error).message}`);
      return undefined;
    }
  }

  private isAllowedMimeType(mimeType: string): boolean {
    return Object.keys(this.maxFileSizes).includes(mimeType);
  }

  private getMaxFileSize(mimeType: string): number {
    return this.maxFileSizes[mimeType] || 10 * 1024 * 1024;
  }

  private getMaxDuration(mimeType: string): number {
    if (mimeType.startsWith('video/')) return 7200;
    if (mimeType.startsWith('audio/')) return 3600;
    return 0;
  }

  private getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  private isExtensionValid(mimeType: string, extension: string): boolean {
    const allowedExts = this.allowedExtensions[mimeType];
    if (!allowedExts) return true;
    return allowedExts.includes(`.${extension}`);
  }

  private async extractDuration(buffer: Buffer, mimeType: string): Promise<number | undefined> {
    try {
      if (mimeType.startsWith('video/')) {
        return await this.extractVideoDuration(buffer);
      } else if (mimeType.startsWith('audio/')) {
        return await this.extractAudioDuration(buffer);
      }
    } catch (error: unknown) {
      this.logger.warn(`Failed to extract duration: ${(error as Error).message}`);
    }
    return undefined;
  }

  private async extractVideoDuration(_buffer: Buffer): Promise<number> {
    return 120; // Mock: 2 minutes default
  }

  private async extractAudioDuration(_buffer: Buffer): Promise<number> {
    return 300; // Mock: 5 minutes default
  }

  async getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await this.circuitBreaker.execute(async () => {
        return getSignedUrl(this.s3Client, command, { expiresIn });
      });

      return url;
    } catch (error: unknown) {
      if (error instanceof CircuitBreakerOpenError) {
        this.logger.warn(`S3 circuit breaker open: ${error.message}`);
        throw new BadRequestException(
          'File download service temporarily unavailable. Please try again later.'
        );
      }
      this.logger.error(`Error getting signed download URL: ${(error as Error).message}`);
      throw error;
    }
  }

  async getSignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn = 3600
  ): Promise<{ uploadUrl: string; key: string }> {
    if (!this.isAllowedMimeType(contentType)) {
      throw new BadRequestException(`File type ${contentType} is not allowed`);
    }

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
      });

      const uploadUrl = await this.circuitBreaker.execute(async () => {
        return getSignedUrl(this.s3Client, command, { expiresIn });
      });

      return { uploadUrl, key };
    } catch (error: unknown) {
      if (error instanceof CircuitBreakerOpenError) {
        this.logger.warn(`S3 circuit breaker open: ${error.message}`);
        throw new BadRequestException(
          'File upload service temporarily unavailable. Please try again later.'
        );
      }
      this.logger.error(`Error getting signed upload URL: ${(error as Error).message}`);
      throw error;
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.circuitBreaker.execute(async () => {
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: key,
          })
        );
      });
    } catch (error: unknown) {
      if (error instanceof CircuitBreakerOpenError) {
        this.logger.warn(`S3 circuit breaker open: ${error.message}`);
        throw new BadRequestException(
          'File deletion service temporarily unavailable. Please try again later.'
        );
      }
      this.logger.error(`Error deleting file from S3: ${(error as Error).message}`);
      throw error;
    }
  }

  async getFileMetadata(key: string): Promise<FileMetadata> {
    try {
      const response = await this.circuitBreaker.execute(async () => {
        return this.s3Client.send(
          new HeadObjectCommand({
            Bucket: this.bucketName,
            Key: key,
          })
        );
      });

      return {
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
        metadata: response.Metadata,
      };
    } catch (error: unknown) {
      if (error instanceof CircuitBreakerOpenError) {
        this.logger.warn(`S3 circuit breaker open: ${error.message}`);
        throw new BadRequestException(
          'File metadata service temporarily unavailable. Please try again later.'
        );
      }
      this.logger.error(`Error getting file metadata from S3: ${(error as Error).message}`);
      throw error;
    }
  }

  async cleanupOrphanedFiles(prefix: string, olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    let deletedCount = 0;
    let continuationToken: string | undefined;

    do {
      const response = await this.s3Client.send(
        new ListObjectsV2Command({
          Bucket: this.bucketName,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        })
      );

      for (const item of response.Contents || []) {
        if (item.LastModified && item.LastModified < cutoffDate) {
          try {
            await this.deleteFile(item.Key || '');
            deletedCount++;
          } catch (error: unknown) {
            this.logger.error(
              `Failed to delete orphaned file ${item.Key}: ${(error as Error).message}`
            );
          }
        }
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    this.logger.log(`Cleaned up ${deletedCount} orphaned files from ${prefix}`);
    return deletedCount;
  }

  async listFiles(prefix: string): Promise<string[]> {
    const keys: string[] = [];
    let continuationToken: string | undefined;

    do {
      const response = await this.s3Client.send(
        new ListObjectsV2Command({
          Bucket: this.bucketName,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        })
      );

      for (const item of response.Contents || []) {
        if (item.Key) {
          keys.push(item.Key);
        }
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return keys;
  }

  generateKey(folder: string, fileId: string, extension: string): string {
    return `${folder}/${fileId}.${extension}`;
  }

  getCircuitBreakerStats(): CircuitBreakerStats {
    return this.circuitBreaker.getStats();
  }
}
