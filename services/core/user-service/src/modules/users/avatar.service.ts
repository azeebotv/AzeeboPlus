import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service.js';
import crypto from 'crypto';

export interface AvatarUploadResult {
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  size: number;
  format: string;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

@Injectable()
export class AvatarService {
  private readonly logger = new Logger(AvatarService.name);
  private readonly cdnBaseUrl: string;
  private readonly maxFileSize: number;
  private readonly allowedFormats: string[];
  private readonly avatarSize = 400;
  private readonly thumbnailSize = 100;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.cdnBaseUrl = this.configService.get<string>('CDN_BASE_URL', 'https://cdn.azeebo.com');
    this.maxFileSize = this.configService.get<number>('AVATAR_MAX_SIZE', 5 * 1024 * 1024); // 5MB
    this.allowedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  }

  /**
   * Upload and process avatar image
   */
  async uploadAvatar(
    userId: string,
    file: { buffer: Buffer; mimetype: string; size: number; originalname: string },
  ): Promise<AvatarUploadResult> {
    // Validate file
    this.validateFile(file);

    // Generate unique filename
    const ext = this.getExtension(file.mimetype);
    const hash = crypto.randomBytes(8).toString('hex');
    const filename = `avatars/${userId}/${hash}.${ext}`;

    // Process image (resize to standard dimensions)
    const processed = await this.processImage(file.buffer, {
      width: this.avatarSize,
      height: this.avatarSize,
      format: ext,
      quality: 85,
    });

    // Generate thumbnail
    const thumbnail = await this.processImage(file.buffer, {
      width: this.thumbnailSize,
      height: this.thumbnailSize,
      format: ext,
      quality: 80,
    });

    const thumbnailFilename = `avatars/${userId}/${hash}_thumb.${ext}`;

    // Upload to CDN/S3 (in production, this would use AWS SDK)
    const url = await this.uploadToStorage(filename, processed.buffer, file.mimetype);
    const thumbnailUrl = await this.uploadToStorage(thumbnailFilename, thumbnail.buffer, file.mimetype);

    // Update user avatar in database
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: url },
    });

    // Also update profile if exists
    try {
      await this.prisma.userProfile.update({
        where: { userId },
        data: { avatar: url },
      });
    } catch {
      // Profile might not exist yet
    }

    this.logger.log(`Avatar uploaded for user ${userId}: ${url}`);

    return {
      url,
      thumbnailUrl,
      width: processed.width,
      height: processed.height,
      size: processed.buffer.length,
      format: file.mimetype,
    };
  }

  /**
   * Delete user avatar
   */
  async deleteAvatar(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: null },
    });

    try {
      await this.prisma.userProfile.update({
        where: { userId },
        data: { avatar: null },
      });
    } catch {
      // Profile might not exist
    }

    this.logger.log(`Avatar deleted for user ${userId}`);
  }

  /**
   * Get avatar upload URL (pre-signed URL for direct upload)
   */
  async getUploadUrl(userId: string, format: string): Promise<{ uploadUrl: string; url: string }> {
    const ext = format.split('/')[1] || 'jpg';
    const hash = crypto.randomBytes(8).toString('hex');
    const filename = `avatars/${userId}/${hash}.${ext}`;

    // In production, generate pre-signed S3 URL
    const uploadUrl = `${this.cdnBaseUrl}/upload?path=${filename}`;
    const url = `${this.cdnBaseUrl}/${filename}`;

    return { uploadUrl, url };
  }

  /**
   * Validate uploaded file
   */
  private validateFile(file: { mimetype: string; size: number }): void {
    if (!this.allowedFormats.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid format. Allowed: ${this.allowedFormats.join(', ')}`
      );
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File too large. Maximum size: ${this.maxFileSize / 1024 / 1024}MB`
      );
    }
  }

  /**
   * Process image (resize, optimize)
   */
  private async processImage(
    buffer: Buffer,
    options: { width: number; height: number; format: string; quality: number },
  ): Promise<{ buffer: Buffer; width: number; height: number }> {
    // In production, use sharp for image processing
    // For now, return the original buffer with dimensions
    // When sharp is available:
    // import sharp from 'sharp';
    // const processed = await sharp(buffer)
    //   .resize(options.width, options.height, { fit: 'cover' })
    //   .toFormat(options.format, { quality: options.quality })
    //   .toBuffer();
    // return { buffer: processed, width: options.width, height: options.height };

    return {
      buffer,
      width: options.width,
      height: options.height,
    };
  }

  /**
   * Upload to CDN/S3 storage
   */
  private async uploadToStorage(
    filename: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    // In production, use AWS S3 SDK:
    // import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
    // const s3 = new S3Client({ region: this.configService.get('AWS_REGION') });
    // await s3.send(new PutObjectCommand({
    //   Bucket: this.configService.get('S3_BUCKET'),
    //   Key: filename,
    //   Body: buffer,
    //   ContentType: contentType,
    //   CacheControl: 'public, max-age=31536000',
    // }));

    // For now, return CDN URL
    return `${this.cdnBaseUrl}/${filename}`;
  }

  /**
   * Get file extension from mimetype
   */
  private getExtension(mimetype: string): string {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };
    return map[mimetype] || 'jpg';
  }
}
