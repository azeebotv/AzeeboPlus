import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Service } from './s3.service';
import { RedisService } from '../../common/services/redis.service';
import { randomUUID } from 'crypto';

export interface PremiumUrlResponse {
  url: string;
  expiresAt: Date;
  contentId: string;
  userId: string;
}

export interface UrlValidationResult {
  valid: boolean;
  contentId?: string;
  userId?: string;
  error?: string;
}

@Injectable()
export class PremiumContentService {
  private readonly logger = new Logger(PremiumContentService.name);
  private readonly defaultExpirySeconds: number;
  private readonly maxExpirySeconds: number;
  private readonly redisKeyPrefix = 'premium_url:';
  private readonly cdnUrl: string;

  constructor(
    private readonly s3Service: S3Service,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService
  ) {
    this.cdnUrl = this.configService.get<string>('CDN_URL') || '';
    this.defaultExpirySeconds = this.configService.get<number>('DEFAULT_URL_EXPIRY_SECONDS', 300);
    this.maxExpirySeconds = this.configService.get<number>('MAX_URL_EXPIRY_SECONDS', 3600);
  }

  async generatePremiumUrl(
    contentId: string,
    userId: string,
    expiresInSeconds?: number
  ): Promise<PremiumUrlResponse> {
    const expiry = this.validateExpiry(expiresInSeconds);
    const urlToken = randomUUID();
    const expiresAt = new Date(Date.now() + expiry * 1000);

    const redisKey = `${this.redisKeyPrefix}${urlToken}`;
    const urlData = {
      contentId,
      userId,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
      accessed: false,
    };

    await this.redisService.set(redisKey, JSON.stringify(urlData));
    await this.redisService.expire(redisKey, expiry);

    const s3Key = await this.resolveContentKey(contentId);
    const signedUrl = await this.s3Service.getSignedDownloadUrl(s3Key, expiry);

    this.logger.log(
      `Generated premium URL for content ${contentId}, user ${userId}, expires ${expiresAt}`
    );

    return {
      url: signedUrl,
      expiresAt,
      contentId,
      userId,
    };
  }

  async generateCdnPremiumUrl(
    contentId: string,
    userId: string,
    expiresInSeconds?: number
  ): Promise<PremiumUrlResponse> {
    const expiry = this.validateExpiry(expiresInSeconds);
    const urlToken = randomUUID();
    const expiresAt = new Date(Date.now() + expiry * 1000);

    const redisKey = `${this.redisKeyPrefix}${urlToken}`;
    const urlData = {
      contentId,
      userId,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
      accessed: false,
    };

    await this.redisService.set(redisKey, JSON.stringify(urlData));
    await this.redisService.expire(redisKey, expiry);

    const s3Key = await this.resolveContentKey(contentId);
    const cdnUrl = this.buildCdnUrl(s3Key, urlToken, expiry);

    this.logger.log(
      `Generated CDN premium URL for content ${contentId}, user ${userId}, expires ${expiresAt}`
    );

    return {
      url: cdnUrl,
      expiresAt,
      contentId,
      userId,
    };
  }

  async validatePremiumUrl(urlToken: string): Promise<UrlValidationResult> {
    const redisKey = `${this.redisKeyPrefix}${urlToken}`;
    const urlDataStr = await this.redisService.get(redisKey);

    if (!urlDataStr) {
      this.logger.warn(`Invalid or expired URL token: ${urlToken}`);
      return {
        valid: false,
        error: 'URL is invalid or has expired',
      };
    }

    try {
      const urlData = JSON.parse(urlDataStr);
      const expiresAt = new Date(urlData.expiresAt);

      if (expiresAt < new Date()) {
        await this.redisService.del(redisKey);
        this.logger.warn(`URL token expired: ${urlToken}`);
        return {
          valid: false,
          error: 'URL has expired',
        };
      }

      await this.markAsAccessed(urlToken, urlData);

      return {
        valid: true,
        contentId: urlData.contentId,
        userId: urlData.userId,
      };
    } catch (error: unknown) {
      this.logger.error(`Error validating URL token: ${error.message}`);
      return {
        valid: false,
        error: 'Invalid URL data',
      };
    }
  }

  async invalidatePremiumUrl(urlToken: string): Promise<void> {
    const redisKey = `${this.redisKeyPrefix}${urlToken}`;
    const result = await this.redisService.del(redisKey);

    if (result > 0) {
      this.logger.log(`Invalidated premium URL token: ${urlToken}`);
    }
  }

  async invalidateAllUserUrls(userId: string): Promise<number> {
    const keys = await this.redisService.scanKeys(`${this.redisKeyPrefix}*`);
    let invalidatedCount = 0;

    for (const key of keys) {
      const urlDataStr = await this.redisService.get(key);
      if (urlDataStr) {
        try {
          const urlData = JSON.parse(urlDataStr);
          if (urlData.userId === userId) {
            await this.redisService.del(key);
            invalidatedCount++;
          }
        } catch (error: unknown) {
          this.logger.warn(`Error parsing URL data for key ${key}: ${error.message}`);
        }
      }
    }

    this.logger.log(`Invalidated ${invalidatedCount} premium URLs for user ${userId}`);
    return invalidatedCount;
  }

  async getUrlAnalytics(urlToken: string): Promise<{
    contentId: string;
    userId: string;
    createdAt: Date;
    expiresAt: Date;
    accessed: boolean;
    accessedAt?: Date;
  } | null> {
    const redisKey = `${this.redisKeyPrefix}${urlToken}`;
    const urlDataStr = await this.redisService.get(redisKey);

    if (!urlDataStr) {
      return null;
    }

    const urlData = JSON.parse(urlDataStr);
    return {
      contentId: urlData.contentId,
      userId: urlData.userId,
      createdAt: new Date(urlData.createdAt),
      expiresAt: new Date(urlData.expiresAt),
      accessed: urlData.accessed,
      accessedAt: urlData.accessedAt ? new Date(urlData.accessedAt) : undefined,
    };
  }

  private validateExpiry(expiresInSeconds?: number): number {
    if (!expiresInSeconds) {
      return this.defaultExpirySeconds;
    }

    if (expiresInSeconds < 60) {
      throw new BadRequestException('Minimum expiry time is 60 seconds');
    }

    if (expiresInSeconds > this.maxExpirySeconds) {
      throw new BadRequestException(`Maximum expiry time is ${this.maxExpirySeconds} seconds`);
    }

    return expiresInSeconds;
  }

  private async resolveContentKey(contentId: string): Promise<string> {
    return `premium/${contentId}`;
  }

  private buildCdnUrl(s3Key: string, token: string, expiresInSeconds: number): string {
    const baseUrl =
      this.cdnUrl || `https://${this.configService.get<string>('AWS_S3_BUCKET')}.s3.amazonaws.com`;
    const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;

    return `${baseUrl}/${s3Key}?token=${token}&expires=${expires}`;
  }

  private async markAsAccessed(token: string, urlData: Record<string, unknown>): Promise<void> {
    const redisKey = `${this.redisKeyPrefix}${token}`;
    urlData.accessed = true;
    urlData.accessedAt = new Date().toISOString();
    await this.redisService.set(redisKey, JSON.stringify(urlData));
  }
}
