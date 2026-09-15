import { Inject, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { mapAndThrow } from '@azeebo/security';
import { ConfigService } from '@nestjs/config';
import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { Readable } from 'stream';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private s3Client: S3Client;
  private bucketName: string;

  constructor(@Inject(ConfigService) private configService: ConfigService) {
    this.bucketName = this.configService.get('AWS_S3_BUCKET') || '';
    this.s3Client = new S3Client({
      region: this.configService.get('AWS_REGION') || 'us-east-1',
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY') || '',
      },
    });
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!key) {
      throw new NotFoundException('Media key not provided');
    }

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });
      return signedUrl;
    } catch (error) {
      this.logger.error(`Error generating signed URL: ${(error as Error).message}`);
      mapAndThrow(error, 'generating signed URL');
    }
  }

  async getMediaUrl(originalUrl: string, expiresIn: number = 3600): Promise<string> {
    if (!originalUrl) {
      throw new NotFoundException('Media URL not provided');
    }

    // If the URL is already a signed URL or not from S3, return it as is
    if (originalUrl.includes('X-Amz-Signature')) {
      return originalUrl;
    }

    // Handle full S3 URLs: https://bucket.s3.amazonaws.com/key
    if (originalUrl.includes('.s3.amazonaws.com/')) {
      const key = originalUrl.split('.s3.amazonaws.com/')[1];
      if (key) {
        return this.getSignedUrl(key, expiresIn);
      }
    }

    // Handle S3 URLs with region: https://bucket.s3.region.amazonaws.com/key
    if (originalUrl.includes('.s3.') && originalUrl.includes('.amazonaws.com/')) {
      const key = originalUrl.split('.amazonaws.com/')[1];
      if (key) {
        return this.getSignedUrl(key, expiresIn);
      }
    }

    // Treat as raw S3 key (e.g., "uploads/video.mp4")
    if (!originalUrl.startsWith('http')) {
      return this.getSignedUrl(originalUrl, expiresIn);
    }

    // Unknown format, return as-is
    return originalUrl;
  }

  /**
   * Presign a direct-to-S3 PUT upload URL for a media asset. The caller
   * uploads the bytes straight to storage; `completeUploadUrl` then registers
   * the asset. Keys are namespaced per content item so ownership is verifiable
   * and objects can't collide across drafts.
   */
  async createUploadUrl(
    contentId: string,
    fileName: string,
    contentType: string,
    fileSize: number,
    expiresIn = 900
  ): Promise<{ signedUrl: string; mediaAssetId: string; key: string }> {
    if (!contentId) throw new NotFoundException('Content id not provided');
    if (!fileName || !contentType) {
      throw new NotFoundException('File name and content type are required');
    }
    if (fileSize <= 0) {
      throw new NotFoundException('File size must be greater than zero');
    }

    // 2GB hard cap, matching the MediaAsset.size Int column limit.
    const MAX_SIZE = 2 * 1024 * 1024 * 1024;
    if (fileSize > MAX_SIZE) {
      throw new NotFoundException('File exceeds the 2GB upload limit');
    }

    const mediaAssetId = randomUUID();
    // Deterministic key: reconstructable from (contentId, mediaAssetId) at
    // complete-time, so the client never has to round-trip the storage key.
    const key = `uploads/${contentId}/${mediaAssetId}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
      ContentLength: fileSize,
    });

    try {
      const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
      return { signedUrl, mediaAssetId, key };
    } catch (error) {
      this.logger.error(`Error generating upload URL: ${(error as Error).message}`);
      mapAndThrow(error, 'generating upload URL');
    }
  }

  /** Stat an uploaded object (used to confirm the client finished its PUT). */
  async statObject(key: string): Promise<{ size: number; contentType?: string }> {
    if (!key) throw new NotFoundException('Object key not provided');
    try {
      const head = await this.s3Client.send(new HeadObjectCommand({ Bucket: this.bucketName, Key: key }));
      return { size: head.ContentLength ?? 0, contentType: head.ContentType };
    } catch (error) {
      this.logger.error(`Error stating object ${key}: ${(error as Error).message}`);
      mapAndThrow(error, 'stating uploaded object');
    }
  }

  async generateThumbnail(
    originalUrl: string,
    options: {
      width: number;
      height: number;
      quality?: number;
    } = { width: 300, height: 200, quality: 80 }
  ): Promise<string> {
    if (!originalUrl) {
      throw new NotFoundException('Original media URL not provided');
    }

    try {
      // Extract the key from the URL
      let key: string;
      if (originalUrl.includes(this.bucketName)) {
        key = originalUrl.split(this.bucketName + '.s3.amazonaws.com/')[1];
        if (!key) {
          throw new Error('Invalid S3 URL');
        }
      } else {
        // If not an S3 URL, treat it as a key
        key = originalUrl;
      }

      // Get the original image from S3
      const getCommand = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(getCommand);
      const body = response.Body as Readable;

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of body) {
        chunks.push(chunk as Buffer);
      }
      const buffer = Buffer.concat(chunks);

      // Generate thumbnail
      const thumbnailBuffer = await sharp(buffer)
        .resize(options.width, options.height, {
          fit: 'cover',
          withoutEnlargement: true,
        })
        .jpeg({ quality: options.quality || 80 })
        .toBuffer();

      // Generate thumbnail key
      const thumbnailKey = `thumbnails/${key.replace(/\.[^/.]+$/, '')}_${options.width}x${options.height}.jpg`;

      // Upload thumbnail to S3
      const putCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: thumbnailKey,
        Body: thumbnailBuffer,
        ContentType: 'image/jpeg',
        ContentDisposition: 'inline',
      });

      await this.s3Client.send(putCommand);

      // Generate signed URL for the thumbnail
      return this.getSignedUrl(thumbnailKey);
    } catch (error) {
      this.logger.error('Error generating thumbnail:', error);
      mapAndThrow(error, 'generating media thumbnail');
    }
  }
}
