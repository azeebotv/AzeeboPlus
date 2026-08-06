import { Inject, Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '../../prisma/client/index.js';

@Injectable()
export class WebhookRetryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WebhookRetryService.name);
  private retryInterval: ReturnType<typeof setInterval> | null = null;

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.startRetryProcessor();
  }

  onModuleDestroy() {
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
    }
  }

  private startRetryProcessor() {
    this.retryInterval = setInterval(async () => {
      try {
        await this.processPendingRetries();
      } catch (error: unknown) {
        this.logger.error('Error processing webhook retries:', error);
      }
    }, 60000);
  }

  private getExponentialBackoffDelay(retryCount: number): number {
    const baseDelay = 60000;
    const maxDelay = 3600000;
    const delay = baseDelay * Math.pow(2, retryCount);
    return Math.min(delay, maxDelay);
  }

  async scheduleRetry(
    eventId: string,
    provider: string,
    type: string,
    payload: Record<string, unknown>,
    error: Error
  ): Promise<void> {
    const existingRetry = await this.prisma.webhookRetry.findFirst({
      where: { eventId, status: 'pending' },
    });

    if (existingRetry) {
      const newRetryCount = existingRetry.retryCount + 1;
      const newNextRetryAt = new Date(Date.now() + this.getExponentialBackoffDelay(newRetryCount));

      if (newRetryCount >= existingRetry.maxRetries) {
        await this.prisma.webhookRetry.update({
          where: { id: existingRetry.id },
          data: {
            status: 'failed',
            lastError: error.message,
            updatedAt: new Date(),
          },
        });
        this.logger.error(`Max retries exceeded for webhook event ${eventId}`);
      } else {
        await this.prisma.webhookRetry.update({
          where: { id: existingRetry.id },
          data: {
            retryCount: newRetryCount,
            nextRetryAt: newNextRetryAt,
            lastError: error.message,
            updatedAt: new Date(),
          },
        });
        this.logger.warn(
          `Scheduled retry ${newRetryCount} for webhook event ${eventId} at ${newNextRetryAt}`
        );
      }
    } else {
      const nextRetryAt = new Date(Date.now() + this.getExponentialBackoffDelay(0));
      await this.prisma.webhookRetry.create({
        data: {
          eventId,
          provider,
          type,
          payload: payload as Prisma.InputJsonValue,
          nextRetryAt,
          lastError: error.message,
        },
      });
      this.logger.warn(`Created first retry for webhook event ${eventId} at ${nextRetryAt}`);
    }
  }

  private async processPendingRetries(): Promise<void> {
    try {
      const pendingRetries = await this.prisma.webhookRetry.findMany({
        where: {
          status: 'pending',
          nextRetryAt: { lte: new Date() },
        },
        take: 10,
      });

      for (const retry of pendingRetries) {
        await this.processRetry(retry);
      }
    } catch (error) {
      this.logger.warn(
        `WebhookRetryService skipped: ${error instanceof Error ? error.message : 'unknown error'}`
      );
    }
  }

  private async processRetry(retry: {
    id: string;
    eventId: string;
    provider: string;
    type: string;
    payload: Prisma.JsonValue;
    retryCount: number;
  }): Promise<void> {
    await this.prisma.webhookRetry.update({
      where: { id: retry.id },
      data: { status: 'processing' },
    });

    try {
      this.logger.log(`Processing retry ${retry.retryCount} for event ${retry.eventId}`);

      switch (retry.provider) {
        case 'paystack':
          await this.processPaystackRetry(retry);
          break;
        case 'flutterwave':
          await this.processFlutterwaveRetry(retry);
          break;
        default:
          this.logger.warn(`Unknown provider ${retry.provider} for retry ${retry.id}`);
          throw new Error(`Unknown provider: ${retry.provider}`);
      }

      await this.prisma.webhookRetry.update({
        where: { id: retry.id },
        data: { status: 'completed', updatedAt: new Date() },
      });
      this.logger.log(`Successfully processed retry for event ${retry.eventId}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to process retry ${retry.id}: ${errorMessage}`);
      await this.scheduleRetry(
        retry.eventId,
        retry.provider,
        retry.type,
        retry.payload as Record<string, unknown>,
        error instanceof Error ? error : new Error(errorMessage)
      );
    }
  }

  private async processPaystackRetry(retry: {
    eventId: string;
    type: string;
    payload: Prisma.JsonValue;
  }): Promise<void> {
    const data = (retry.payload as Record<string, unknown>).data as Record<string, unknown>;
    const reference = data?.reference as string;

    switch (retry.type) {
      case 'charge.success':
        await this.processPaymentSuccess(reference);
        break;
      case 'charge.failed':
        await this.processPaymentFailed(reference);
        break;
      case 'refund.success':
        await this.processRefundSuccess(data);
        break;
      default:
        this.logger.warn(`Unhandled Paystack event type: ${retry.type}`);
    }
  }

  private async processFlutterwaveRetry(retry: {
    eventId: string;
    type: string;
    payload: Prisma.JsonValue;
  }): Promise<void> {
    const data = (retry.payload as Record<string, unknown>).data as Record<string, unknown>;
    const reference = (data?.tx_ref as string) || (data?.reference as string);

    switch (retry.type) {
      case 'charge.completed':
        await this.processPaymentSuccess(reference);
        break;
      case 'charge.failed':
        await this.processPaymentFailed(reference);
        break;
      case 'refund.completed':
        await this.processRefundSuccess(data);
        break;
      default:
        this.logger.warn(`Unhandled Flutterwave event type: ${retry.type}`);
    }
  }

  private async processPaymentSuccess(reference: string): Promise<void> {
    const paymentIntent = await this.prisma.paymentIntent.findFirst({
      where: { providerReference: reference },
    });

    if (!paymentIntent || paymentIntent.status === 'completed') {
      return;
    }

    await this.prisma.paymentIntent.update({
      where: { id: paymentIntent.id },
      data: { status: 'completed', completedAt: new Date() },
    });
  }

  private async processPaymentFailed(reference: string): Promise<void> {
    const paymentIntent = await this.prisma.paymentIntent.findFirst({
      where: { providerReference: reference },
    });

    if (paymentIntent) {
      await this.prisma.paymentIntent.update({
        where: { id: paymentIntent.id },
        data: { status: 'failed' },
      });
    }
  }

  private async processRefundSuccess(data: Record<string, unknown>): Promise<void> {
    const transaction = data.transaction as string;
    const reference = data.reference as string;

    const paymentIntent = await this.prisma.paymentIntent.findFirst({
      where: { providerReference: transaction },
    });

    if (paymentIntent) {
      const refund = await this.prisma.refund.findFirst({
        where: { paymentIntentId: paymentIntent.id },
      });

      if (refund) {
        await this.prisma.refund.update({
          where: { id: refund.id },
          data: { status: 'completed', providerReference: reference },
        });
      }
    }
  }
}
