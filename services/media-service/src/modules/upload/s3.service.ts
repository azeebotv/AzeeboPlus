import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { CircuitBreaker, CircuitBreakerOpenError } from '@azeebo/shared-types';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private s3Client: S3Client;
  private bucketName: string;
  private cdnUrl: string;
  private region: string;
  private readonly circuitBreaker: CircuitBreaker;

  constructor(private configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET') || 'azeebo-media';
    this.cdnUrl = this.configService.get<string>('CDN_URL') || '';

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
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
    folder: string = 'uploads',
  ): Promise<{ key: string; url: string; cdnUrl: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'audio/mpeg',
      'audio/aac',
      'application/pdf',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(`File type ${file.mimetype} is not allowed`);
    }

    const maxFileSize = this.getMaxFileSize(file.mimetype);
    if (file.size > maxFileSize) {
      throw new BadRequestException(`File size exceeds maximum allowed size of ${maxFileSize / 1024 / 1024}MB`);
    }

    const fileExtension = file.originalname.split('.').pop() || '';
    const key = `${folder}/${uuidv4()}.${fileExtension}`;

    try {
      await this.circuitBreaker.execute(async () => {
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            Metadata: {
              'original-name': file.originalname,
            },
          }),
        );
      });
    } catch (error) {
      if (error instanceof CircuitBreakerOpenError) {
        this.logger.warn(`S3 circuit breaker open: ${error.message}`);
        throw new BadRequestException('File upload service temporarily unavailable. Please try again later.');
      }
      this.logger.error(`Error uploading file to S3: ${(error as Error).message}`);
      throw error;
    }

    const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
    const cdnUrl = this.cdnUrl ? `${this.cdnUrl}/${key}` : url;

    return { key, url, cdnUrl };
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
    } catch (error) {
      if (error instanceof CircuitBreakerOpenError) {
        this.logger.warn(`S3 circuit breaker open: ${error.message}`);
        throw new BadRequestException('File download service temporarily unavailable. Please try again later.');
      }
      this.logger.error(`Error getting signed download URL: ${(error as Error).message}`);
      throw error;
    }
  }

  async getSignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn = 3600,
  ): Promise<{ uploadUrl: string; key: string }> {
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
    } catch (error) {
      if (error instanceof CircuitBreakerOpenError) {
        this.logger.warn(`S3 circuit breaker open: ${error.message}`);
        throw new BadRequestException('File upload service temporarily unavailable. Please try again later.');
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
          }),
        );
      });
    } catch (error) {
      if (error instanceof CircuitBreakerOpenError) {
        this.logger.warn(`S3 circuit breaker open: ${error.message}`);
        throw new BadRequestException('File deletion service temporarily unavailable. Please try again later.');
      }
      this.logger.error(`Error deleting file from S3: ${(error as Error).message}`);
      throw error;
    }
  }

  async getFileMetadata(key: string): Promise<any> {
    try {
      const response = await this.circuitBreaker.execute(async () => {
        return this.s3Client.send(
          new HeadObjectCommand({
            Bucket: this.bucketName,
            Key: key,
          }),
        );
      });

      return {
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
        metadata: response.Metadata,
      };
    } catch (error) {
      if (error instanceof CircuitBreakerOpenError) {
        this.logger.warn(`S3 circuit breaker open: ${error.message}`);
        throw new BadRequestException('File metadata service temporarily unavailable. Please try again later.');
      }
      this.logger.error(`Error getting file metadata from S3: ${(error as Error).message}`);
      throw error;
    }
  }

  private getMaxFileSize(mimetype: string): number {
    if (mimetype.startsWith('image/')) return 50 * 1024 * 1024;
    if (mimetype.startsWith('video/')) return 500 * 1024 * 1024;
    if (mimetype.startsWith('audio/')) return 100 * 1024 * 1024;
    if (mimetype === 'application/pdf') return 50 * 1024 * 1024;
    return 10 * 1024 * 1024;
  }

  generateKey(folder: string, fileId: string, extension: string): string {
    return `${folder}/${fileId}.${extension}`;
  }

  getCircuitBreakerStats() {
    return this.circuitBreaker.getStats();
  }
}