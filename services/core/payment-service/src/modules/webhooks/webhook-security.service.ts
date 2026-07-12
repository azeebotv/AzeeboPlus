import {Inject,  Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { RedisService } from '../../common/services/redis.service.js';

@Injectable()
export class WebhookSecurityService {
  private readonly logger = new Logger(WebhookSecurityService.name);
  private readonly idempotencyTTL: number;
  private readonly maxAge: number;
  private readonly idempotencyPrefix = 'webhook_processed:';
  private readonly replayPrefix = 'webhook_replay:';

  constructor(
    @Inject(RedisService) private readonly redisService: RedisService,
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {
    this.idempotencyTTL = this.configService.get<number>('WEBHOOK_IDEMPOTENCY_TTL', 86400);
    this.maxAge = this.configService.get<number>('WEBHOOK_MAX_AGE', 300);
  }

  verifyPaystackSignature(rawBody: string, signature: string, secret: string): boolean {
    if (!signature || !secret) return false;

    const expectedSignature = createHmac('sha512', secret).update(rawBody).digest('hex');

    return this.constantTimeCompare(signature, expectedSignature);
  }

  verifyFlutterwaveSignature(rawBody: string, signature: string, secret: string): boolean {
    if (!signature || !secret) return false;

    const expectedSignature = createHmac('sha256', secret).update(rawBody).digest('hex');

    return this.constantTimeCompare(signature, expectedSignature);
  }

  async isDuplicate(reference: string): Promise<boolean> {
    const key = `${this.idempotencyPrefix}${reference}`;
    return this.redisService.exists(key);
  }

  async markAsProcessed(reference: string): Promise<void> {
    const key = `${this.idempotencyPrefix}${reference}`;
    await this.redisService.set(key, '1', this.idempotencyTTL);
    this.logger.log(`Webhook marked as processed: ${reference}`);
  }

  async isReplay(reference: string, timestamp: number): Promise<boolean> {
    const now = Math.floor(Date.now() / 1000);
    if (now - timestamp > this.maxAge) {
      this.logger.warn(`Webhook event too old: ${reference} (age: ${now - timestamp}s)`);
      return true;
    }

    const key = `${this.replayPrefix}${reference}`;
    const exists = await this.redisService.exists(key);
    return exists;
  }

  async recordInReplayWindow(reference: string): Promise<void> {
    const key = `${this.replayPrefix}${reference}`;
    await this.redisService.set(key, '1', this.maxAge);
  }

  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    const bufferA = Buffer.from(a, 'utf8');
    const bufferB = Buffer.from(b, 'utf8');
    return timingSafeEqual(bufferA, bufferB);
  }
}
