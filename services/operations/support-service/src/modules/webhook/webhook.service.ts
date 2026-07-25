import { Inject, Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';
import axios from 'axios';

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
  private readonly paymentServiceUrl: string;
  private readonly subscriptionServiceUrl: string;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {
    this.paymentServiceUrl = this.configService.get<string>(
      'PAYMENT_SERVICE_URL',
      'http://payment-service:3003'
    );
    this.subscriptionServiceUrl = this.configService.get<string>(
      'SUBSCRIPTION_SERVICE_URL',
      'http://subscription-service:3010'
    );
  }

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

      // Dispatch event to appropriate service based on type
      await this.dispatchEvent(event);

      this.logger.log(`Webhook event processed: ${event.id}`);

      return {
        processed: true,
        eventId: createdEvent.id,
      };
    } catch (error) {
      this.logger.error(
        `processWebhook failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return { processed: false, eventId: event.id };
    }
  }

  private async dispatchEvent(event: WebhookEvent): Promise<void> {
    const eventType = event.type.toLowerCase();
    const payload = event.payload;

    try {
      if (eventType.includes('payment') || eventType.includes('charge')) {
        await axios.post(`${this.paymentServiceUrl}/webhooks/paystack`, payload, {
          timeout: 10000,
        });
        this.logger.log(`Dispatched payment event ${event.type} to payment-service`);
      } else if (eventType.includes('subscription') || eventType.includes('plan')) {
        await axios.post(`${this.subscriptionServiceUrl}/webhooks`, payload, { timeout: 10000 });
        this.logger.log(`Dispatched subscription event ${event.type} to subscription-service`);
      } else {
        this.logger.warn(`No handler registered for webhook event type: ${event.type}`);
      }
    } catch (dispatchError) {
      this.logger.error(
        `Failed to dispatch webhook event ${event.type}: ${(dispatchError as Error).message}`
      );
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
      this.logger.error(
        `getWebhookEvents failed: ${(error as Error).message}`,
        (error as Error).stack
      );
      return [];
    }
  }
}
