import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';

export interface WebhookEvent {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  provider: string;
}

export interface WebhookResult {
  processed: boolean;
  duplicate?: boolean;
  eventId?: string;
}

export interface WebhookEventRecord {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  provider: string;
  processedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private readonly prisma: PrismaService) {}

  async processWebhook(event: WebhookEvent): Promise<WebhookResult> {
    try {
      const existingEvent = await this.prisma.webhookEvent.findUnique({
        where: { id: event.id },
      });

      if (existingEvent) {
        this.logger.warn(`Duplicate webhook event detected: ${event.id}`);
        return {
          processed: false,
          duplicate: true,
          eventId: existingEvent.id,
        };
      }

      const createdEvent = await this.prisma.webhookEvent.create({
        data: {
          id: event.id,
          type: event.type,
          payload: event.payload as Prisma.InputJsonValue,
          provider: event.provider,
          processedAt: new Date(),
        },
      });

      this.logger.log(`Webhook event processed: ${event.id}`);

      return {
        processed: true,
        eventId: createdEvent.id,
      };
    } catch (error) {
      this.logger.error(`processWebhook failed: ${error.message}`, error.stack);
      return { success: false, error: error.message } as unknown as WebhookResult;
    }
  }

  validateSignature(payload: string, signature: string, secret: string): void {
    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    const sigBuf = Buffer.from(signature, 'hex');
    const expectedBuf = Buffer.from(expectedSignature, 'hex');
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  async getWebhookEvents(provider?: string, limit = 100): Promise<WebhookEventRecord[]> {
    try {
      const events = await this.prisma.webhookEvent.findMany({
        where: provider ? { provider } : undefined,
        take: limit,
        orderBy: { processedAt: 'desc' },
      });

      return events as WebhookEventRecord[];
    } catch (error) {
      this.logger.error(`getWebhookEvents failed: ${error.message}`, error.stack);
      return [];
    }
  }
}
