import { Inject, Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import axios from 'axios';

@Injectable()
export class TranscodingService {
  private readonly logger = new Logger(TranscodingService.name);
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

  async startTranscodingJob(
    mediaAssetId: string,
    originalUrl: string,
    options: {
      formats?: string[];
      resolutions?: string[];
      bitrates?: number[];
    } = {}
  ): Promise<{ jobId: string; status: string; message: string }> {
    if (!originalUrl) {
      throw new BadRequestException('Original media URL is required');
    }

    try {
      let key: string;
      if (originalUrl.includes(this.bucketName)) {
        key = originalUrl.split(this.bucketName + '.s3.amazonaws.com/')[1];
        if (!key) {
          throw new BadRequestException('Invalid S3 URL');
        }
      } else {
        key = originalUrl;
      }

      const jobId = `transcode_${Date.now()}_${mediaAssetId}`;

      // Delegate to media-service for actual transcoding
      const mediaServiceUrl = this.configService.get<string>('MEDIA_SERVICE_URL');
      if (mediaServiceUrl) {
        try {
          await axios.post(
            `${mediaServiceUrl}/v1/upload/transcode`,
            {
              jobId,
              inputKey: key,
              mediaAssetId,
              formats: options.formats || ['mp4'],
              resolutions: options.resolutions || ['720p', '480p', '360p'],
            },
            {
              timeout: 10000,
              headers: {
                'x-internal-api-key': this.configService.get<string>('INTERNAL_API_KEY', ''),
              },
            }
          );
          this.logger.log(`Transcoding job ${jobId} delegated to media-service`);
        } catch (delegateError) {
          this.logger.warn(
            `Failed to delegate to media-service: ${(delegateError as Error).message} — job created but may not process`
          );
        }
      } else {
        this.logger.warn(
          `No MEDIA_SERVICE_URL configured — transcoding job ${jobId} created but won't be processed`
        );
      }

      this.logger.log('Transcoding job started:', {
        jobId,
        mediaAssetId,
        key,
        options,
      });

      return {
        jobId,
        status: 'pending',
        message: 'Transcoding job started',
      };
    } catch (error) {
      this.logger.error('Error starting transcoding job:', error);
      throw new BadRequestException('Failed to start transcoding job');
    }
  }

  async getTranscodingJobStatus(jobId: string): Promise<unknown> {
    this.logger.log('Getting transcoding job status:', jobId);

    const mediaServiceUrl = this.configService.get<string>('MEDIA_SERVICE_URL');
    if (mediaServiceUrl) {
      try {
        const response = await axios.get(`${mediaServiceUrl}/v1/upload/transcoding/${jobId}`, {
          timeout: 5000,
          headers: { 'x-internal-api-key': this.configService.get<string>('INTERNAL_API_KEY', '') },
        });
        return response.data?.data || response.data;
      } catch (error) {
        this.logger.warn(
          `Failed to fetch transcoding status from media-service: ${(error as Error).message}`
        );
      }
    }

    return {
      jobId,
      status: 'pending',
      progress: 0,
    };
  }

  async getTranscodedMediaUrl(
    jobId: string,
    format: string,
    resolution: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const key = `transcoded/${jobId}/${resolution}.${format === 'hls' ? 'm3u8' : 'mp4'}`;

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
      this.logger.error('Error generating signed URL for transcoded media:', error);
      throw new BadRequestException('Failed to generate signed URL');
    }
  }
}
