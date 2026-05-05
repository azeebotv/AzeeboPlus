import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import { Readable } from 'stream';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get('S3_BUCKET_NAME') || '';
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
      throw new NotFoundException('Failed to generate signed URL');
    }
  }

  async getMediaUrl(originalUrl: string, expiresIn: number = 3600): Promise<string> {
    // If the URL is already a signed URL or not from S3, return it as is
    if (!originalUrl.includes(this.bucketName)) {
      return originalUrl;
    }

    // Extract the key from the URL
    const key = originalUrl.split(this.bucketName + '.s3.amazonaws.com/')[1];
    if (!key) {
      return originalUrl;
    }

    return this.getSignedUrl(key, expiresIn);
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
      throw new Error('Failed to generate thumbnail');
    }
  }
}
