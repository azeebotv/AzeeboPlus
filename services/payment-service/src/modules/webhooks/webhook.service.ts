import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface WebhookPayload {
  id: string;
  type: string;
  data: any;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private prisma: PrismaService) {}

  async handlePaystackWebhook(payload: WebhookPayload): Promise<void> {
    const eventId = payload.id;

    if (await this.isEventProcessed(eventId)) {
      this.logger.log(`Duplicate Paystack event ignored: ${eventId}`);
      return;
    }

    switch (payload.type) {
      case 'charge.success':
        await this.handlePaymentCompleted(payload.data);
        break;
      case 'charge.failed':
        await this.handlePaymentFailed(payload.data);
        break;
      case 'refund':
        await this.handlePaymentRefunded(payload.data);
        break;
      default:
        this.logger.warn(`Unknown Paystack event type: ${payload.type}`);
    }

    await this.markEventProcessed(eventId, 'paystack');
  }

  async handleFlutterwaveWebhook(payload: WebhookPayload): Promise<void> {
    const eventId = payload.id;

    if (await this.isEventProcessed(eventId)) {
      this.logger.log(`Duplicate Flutterwave event ignored: ${eventId}`);
      return;
    }

    switch (payload.type) {
      case 'charge.completed':
        await this.handlePaymentCompleted(payload.data);
        break;
      case 'charge.failed':
        await this.handlePaymentFailed(payload.data);
        break;
      case 'refund':
        await this.handlePaymentRefunded(payload.data);
        break;
      default:
        this.logger.warn(`Unknown Flutterwave event type: ${payload.type}`);
    }

    await this.markEventProcessed(eventId, 'flutterwave');
  }

  private async isEventProcessed(eventId: string): Promise<boolean> {
    const event = await this.prisma.webhookEvent.findUnique({
      where: { eventId },
    });
    return !!event;
  }

  private async markEventProcessed(eventId: string, provider: string): Promise<void> {
    await this.prisma.webhookEvent.create({
      data: {
        eventId,
        provider,
        processedAt: new Date(),
      },
    });
  }

  private async handlePaymentCompleted(data: any): Promise<void> {
    const paymentId = data.paymentId || data.id;
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'COMPLETED',
        updatedAt: new Date(),
      },
    });
    this.logger.log(`Payment completed: ${paymentId}`);
  }

  private async handlePaymentFailed(data: any): Promise<void> {
    const paymentId = data.paymentId || data.id;
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'FAILED',
        failureReason: data.reason,
        updatedAt: new Date(),
      },
    });
    this.logger.log(`Payment failed: ${paymentId}`);
  }

  private async handlePaymentRefunded(data: any): Promise<void> {
    const paymentId = data.paymentId || data.id;
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'REFUNDED',
        refundAmount: data.amount,
        updatedAt: new Date(),
      },
    });
    this.logger.log(`Payment refunded: ${paymentId}`);
  }
}