import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '../../prisma/client';
import { WebhookRetryService } from '../payments/webhook-retry.service';

export interface WebhookPayload {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

interface PaystackWebhookData {
  id?: string;
  status?: string;
  reason?: string;
  amount?: number;
  currency?: string;
  reference?: string;
  metadata?: Record<string, unknown>;
  customer?: {
    email?: string;
    id?: string;
  };
}

interface FlutterwaveWebhookData {
  id?: string;
  status?: string;
  reason?: string;
  amount?: number;
  currency?: string;
  txRef?: string;
  flutterwaveRef?: string;
  metadata?: Record<string, unknown>;
  customer?: {
    email?: string;
    id?: string;
  };
}

type WebhookProcessingResult = 'success' | 'failed';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private prisma: PrismaService,
    private webhookRetryService: WebhookRetryService
  ) {}

  async handlePaystackWebhook(payload: WebhookPayload): Promise<void> {
    const eventId = payload.id;
    const rawPayload = payload as unknown as Prisma.InputJsonValue;

    if (await this.isEventProcessed(eventId)) {
      this.logger.log(`Duplicate Paystack event ignored: ${eventId}`);
      return;
    }

    try {
      switch (payload.type) {
        case 'charge.success':
          await this.handlePaymentCompleted('paystack', payload.data as PaystackWebhookData);
          break;
        case 'charge.failed':
          await this.handlePaymentFailed('paystack', payload.data as PaystackWebhookData);
          break;
        case 'refund':
          await this.handlePaymentRefunded('paystack', payload.data as PaystackWebhookData);
          break;
        default:
          this.logger.warn(`Unknown Paystack event type: ${payload.type}`);
      }

      await this.markEventProcessed(eventId, 'paystack', payload.type, 'success', rawPayload);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to process Paystack event ${eventId}: ${errorMessage}`);
      await this.markEventProcessed(
        eventId,
        'paystack',
        payload.type,
        'failed',
        rawPayload,
        errorMessage
      );
      await this.webhookRetryService.scheduleRetry(
        eventId,
        'paystack',
        payload.type,
        payload,
        error instanceof Error ? error : new Error(errorMessage)
      );
      throw error;
    }
  }

  async handleFlutterwaveWebhook(payload: WebhookPayload): Promise<void> {
    const eventId = payload.id;
    const rawPayload = payload as unknown as Prisma.InputJsonValue;

    if (await this.isEventProcessed(eventId)) {
      this.logger.log(`Duplicate Flutterwave event ignored: ${eventId}`);
      return;
    }

    try {
      switch (payload.type) {
        case 'charge.completed':
          await this.handlePaymentCompleted('flutterwave', payload.data as FlutterwaveWebhookData);
          break;
        case 'charge.failed':
          await this.handlePaymentFailed('flutterwave', payload.data as FlutterwaveWebhookData);
          break;
        case 'refund':
          await this.handlePaymentRefunded('flutterwave', payload.data as FlutterwaveWebhookData);
          break;
        default:
          this.logger.warn(`Unknown Flutterwave event type: ${payload.type}`);
      }

      await this.markEventProcessed(eventId, 'flutterwave', payload.type, 'success', rawPayload);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to process Flutterwave event ${eventId}: ${errorMessage}`);
      await this.markEventProcessed(
        eventId,
        'flutterwave',
        payload.type,
        'failed',
        rawPayload,
        errorMessage
      );
      await this.webhookRetryService.scheduleRetry(
        eventId,
        'flutterwave',
        payload.type,
        payload,
        error instanceof Error ? error : new Error(errorMessage)
      );
      throw error;
    }
  }

  private async isEventProcessed(eventId: string): Promise<boolean> {
    const event = await this.prisma.webhookEvent.findUnique({
      where: { eventId },
    });
    return !!event;
  }

  private async markEventProcessed(
    eventId: string,
    provider: string,
    type: string,
    result: WebhookProcessingResult,
    payload: Prisma.InputJsonValue,
    failureReason?: string
  ): Promise<void> {
    await this.prisma.webhookEvent.create({
      data: {
        eventId,
        provider,
        type,
        payload,
        processedAt: new Date(),
        failureReason,
      },
    });
  }

  private async handlePaymentCompleted(
    provider: string,
    data: PaystackWebhookData | FlutterwaveWebhookData
  ): Promise<void> {
    const paymentId = this.extractPaymentReference(provider, data);
    if (!paymentId) {
      this.logger.warn(`No payment reference found in ${provider} webhook data`);
      return;
    }

    const paymentUpdate = this.buildPaymentUpdate(provider, data, 'COMPLETED');

    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (payment) {
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: paymentUpdate,
      });
    } else {
      const paymentIntent = await this.prisma.paymentIntent.findUnique({
        where: { id: paymentId },
      });
      if (paymentIntent) {
        await this.prisma.paymentIntent.update({
          where: { id: paymentId },
          data: paymentUpdate,
        });
      } else {
        this.logger.warn(`Payment/PaymentIntent not found: ${paymentId}`);
      }
    }

    this.logger.log(`Payment completed (${provider}): ${paymentId}`);
  }

  private async handlePaymentFailed(
    provider: string,
    data: PaystackWebhookData | FlutterwaveWebhookData
  ): Promise<void> {
    const paymentId = this.extractPaymentReference(provider, data);
    const reason = this.extractFailureReason(provider, data);

    if (!paymentId) {
      this.logger.warn(`No payment reference found in ${provider} webhook data`);
      return;
    }

    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (payment) {
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'FAILED',
          failureReason: reason,
          updatedAt: new Date(),
        },
      });
    } else {
      const paymentIntent = await this.prisma.paymentIntent.findUnique({
        where: { id: paymentId },
      });
      if (paymentIntent) {
        await this.prisma.paymentIntent.update({
          where: { id: paymentId },
          data: {
            status: 'FAILED',
            providerReference: reason,
            updatedAt: new Date(),
          },
        });
      } else {
        this.logger.warn(`Payment/PaymentIntent not found: ${paymentId}`);
      }
    }

    this.logger.log(`Payment failed (${provider}): ${paymentId} - ${reason}`);
  }

  private async handlePaymentRefunded(
    provider: string,
    data: PaystackWebhookData | FlutterwaveWebhookData
  ): Promise<void> {
    const paymentId = this.extractPaymentReference(provider, data);
    const refundAmount = this.extractAmount(data);

    if (!paymentId) {
      this.logger.warn(`No payment reference found in ${provider} webhook data`);
      return;
    }

    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (payment) {
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'REFUNDED',
          refundAmount,
          updatedAt: new Date(),
        },
      });
    } else {
      const paymentIntent = await this.prisma.paymentIntent.findUnique({
        where: { id: paymentId },
      });
      if (paymentIntent) {
        await this.prisma.paymentIntent.update({
          where: { id: paymentId },
          data: {
            status: 'REFUNDED',
            updatedAt: new Date(),
          },
        });
      } else {
        this.logger.warn(`Payment/PaymentIntent not found: ${paymentId}`);
      }
    }

    this.logger.log(`Payment refunded (${provider}): ${paymentId} - ${refundAmount}`);
  }

  private extractPaymentReference(
    provider: string,
    data: PaystackWebhookData | FlutterwaveWebhookData
  ): string | null {
    if (provider === 'paystack') {
      const paystackData = data as PaystackWebhookData;
      return paystackData.reference || paystackData.id || null;
    } else {
      const flutterwaveData = data as FlutterwaveWebhookData;
      return flutterwaveData.txRef || flutterwaveData.id || null;
    }
  }

  private extractFailureReason(
    provider: string,
    data: PaystackWebhookData | FlutterwaveWebhookData
  ): string | null {
    if (provider === 'paystack') {
      const paystackData = data as PaystackWebhookData;
      return paystackData.reason || paystackData.status || null;
    } else {
      const flutterwaveData = data as FlutterwaveWebhookData;
      return flutterwaveData.reason || flutterwaveData.status || null;
    }
  }

  private extractAmount(data: PaystackWebhookData | FlutterwaveWebhookData): number | undefined {
    return data.amount;
  }

  private buildPaymentUpdate(
    provider: string,
    data: PaystackWebhookData | FlutterwaveWebhookData,
    status: string
  ): Prisma.PaymentUpdateInput {
    const update: Prisma.PaymentUpdateInput = {
      status,
      updatedAt: new Date(),
    };

    if (provider === 'paystack') {
      const paystackData = data as PaystackWebhookData;
      update.providerRef = paystackData.reference;
    } else {
      const flutterwaveData = data as FlutterwaveWebhookData;
      update.providerRef = flutterwaveData.txRef || flutterwaveData.flutterwaveRef;
    }

    return update;
  }
}
