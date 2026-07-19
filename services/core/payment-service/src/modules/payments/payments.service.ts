import { Inject, Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service.js';
import { InitializePaymentDto } from './dto/initialize-payment.dto.js';
import { PaystackProvider } from './providers/paystack.provider.js';
import { FlutterwaveProvider } from './providers/flutterwave.provider.js';
import { WebhookRetryService } from './webhook-retry.service.js';
import { RedisService, CacheService, cacheKey } from '@azeebo/shared-services';
import axios from 'axios';
import { Prisma } from '@prisma/client';
import {
  PaymentResponse,
  InitializePaymentResponse,
  VerifyPaymentResponse,
  TransactionHistoryResponse,
} from './interfaces/payment-response.interface.js';
import { toNumber } from '@azeebo/utils';

interface ProviderResponse {
  reference: string;
  authorizationUrl: string;
}

interface WebhookData {
  reference: string;
  transaction?: string;
}

type PaymentProvider = 'paystack' | 'flutterwave';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly analyticsServiceBaseUrl: string;
  private readonly walletServiceBaseUrl: string;
  private readonly MIN_PAYMENT_AMOUNT_NGN: number;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PaystackProvider) private readonly paystackProvider: PaystackProvider,
    @Inject(FlutterwaveProvider) private readonly flutterwaveProvider: FlutterwaveProvider,
    @Inject(WebhookRetryService) private readonly webhookRetryService: WebhookRetryService,
    @Inject(RedisService) private readonly redisService: RedisService,
    @Inject(CacheService) private readonly cache: CacheService,
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {
    this.analyticsServiceBaseUrl = this.configService.getOrThrow<string>('ANALYTICS_SERVICE_URL');
    this.walletServiceBaseUrl = this.configService.getOrThrow<string>('WALLET_SERVICE_URL');
    this.MIN_PAYMENT_AMOUNT_NGN = this.configService.get<number>('MIN_PAYMENT_AMOUNT_NGN', 100);
  }

  private getProvider(provider: PaymentProvider) {
    return provider === 'paystack' ? this.paystackProvider : this.flutterwaveProvider;
  }

  private async trackAnalyticsEvent(
    eventName: string,
    userId: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    try {
      await axios.post(`${this.analyticsServiceBaseUrl}/analytics/track`, {
        eventName,
        userId,
        universe: 'payment',
        metadata,
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      this.logger.warn('Failed to track analytics event:', error);
    }
  }

  private async creditWallet(
    userId: string,
    amount: number,
    description: string,
    reference: string,
    provider: PaymentProvider = 'paystack'
  ): Promise<void> {
    try {
      await axios.post(`${this.walletServiceBaseUrl}/wallet/credit`, {
        userId,
        amount,
        description,
        reference,
        provider,
        providerRef: reference,
      });
    } catch (error: unknown) {
      this.logger.error(`Failed to credit wallet for user ${userId}:`, error);
      throw error;
    }
  }

  private async debitWallet(
    userId: string,
    amount: number,
    description: string,
    reference: string,
    provider: PaymentProvider = 'paystack'
  ): Promise<void> {
    try {
      await axios.post(`${this.walletServiceBaseUrl}/wallet/debit`, {
        userId,
        amount,
        description,
        reference,
        provider,
        providerRef: reference,
      });
    } catch (error: unknown) {
      this.logger.error(`Failed to debit wallet for user ${userId}:`, error);
      throw error;
    }
  }

  async initializePayment(
    userId: string,
    initializePaymentDto: InitializePaymentDto
  ): Promise<InitializePaymentResponse> {
    const { amount, currency, description, metadata, idempotencyKey } = initializePaymentDto;

    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    if (currency === 'NGN' && amount < this.MIN_PAYMENT_AMOUNT_NGN) {
      throw new BadRequestException(
        `Minimum payment amount for NGN is ${this.MIN_PAYMENT_AMOUNT_NGN}`
      );
    }

    if (idempotencyKey) {
      const existingPayment = await this.prisma.paymentIntent.findUnique({
        where: { idempotencyKey },
      });
      if (existingPayment) {
        const existingStatus =
          existingPayment.status === 'processing' ? 'pending' : existingPayment.status;
        return {
          success: true,
          data: {
            paymentId: existingPayment.id,
            provider: 'paystack',
            checkoutUrl: '',
            reference: existingPayment.providerReference || '',
            amount: toNumber(existingPayment.amount.toString()),
            currency: existingPayment.currency,
            status: existingStatus as 'pending' | 'completed' | 'failed',
            createdAt: existingPayment.createdAt.toISOString(),
          },
        };
      }
    }

    const paymentIntent = await this.prisma.paymentIntent.create({
      data: {
        userId,
        amount,
        currency: currency || 'NGN',
        status: 'pending',
        description,
        // Prisma.InputJsonValue cast is required because Prisma's JSON type is overly restrictive
        metadata: (metadata || {}) as Prisma.InputJsonValue,
        idempotencyKey,
      },
    });

    try {
      const providerResponse: ProviderResponse = await this.paystackProvider.initializePayment(
        amount,
        currency || 'NGN',
        userId
      );

      await this.prisma.paymentIntent.update({
        where: { id: paymentIntent.id },
        data: {
          providerReference: providerResponse.reference,
          status: 'processing',
        },
      });

      return {
        success: true,
        data: {
          paymentId: paymentIntent.id,
          provider: 'paystack',
          checkoutUrl: providerResponse.authorizationUrl,
          reference: providerResponse.reference,
          amount,
          currency: currency || 'NGN',
          status: 'pending',
          createdAt: paymentIntent.createdAt.toISOString(),
        },
      };
    } catch (error: unknown) {
      await this.prisma.paymentIntent.update({
        where: { id: paymentIntent.id },
        data: {
          status: 'failed',
        },
      });

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Payment initialization failed: ${errorMessage}`);
    }
  }

  async verifyPayment(userId: string, transactionId: string): Promise<VerifyPaymentResponse> {
    const paymentIntent = await this.prisma.paymentIntent.findUnique({
      where: { id: transactionId },
    });

    if (!paymentIntent) {
      throw new NotFoundException(`Payment not found`);
    }

    if (paymentIntent.userId !== userId) {
      throw new BadRequestException('Invalid payment for user');
    }

    if (paymentIntent.status === 'completed') {
      return {
        success: true,
        data: {
          paymentId: paymentIntent.id,
          provider: 'paystack',
          reference: paymentIntent.providerReference || '',
          status: 'completed',
          amount: toNumber(paymentIntent.amount.toString()),
          currency: paymentIntent.currency,
          paidAt: paymentIntent.completedAt?.toISOString(),
          transactionId: paymentIntent.providerReference || undefined,
        },
      };
    }

    // SECURITY: Use a distributed lock to prevent double-crediting from concurrent verify calls.
    const lockKey = `payment_verify_lock:${paymentIntent.id}`;
    const lockAcquired = await this.redisService.setIfNotExists(lockKey, '1', 60);
    if (!lockAcquired) {
      this.logger.warn(
        `Payment ${paymentIntent.id} verification is being processed by another request, skipping`
      );
      // Re-check status after lock contention — another request may have completed it
      const freshIntent = await this.prisma.paymentIntent.findUnique({
        where: { id: paymentIntent.id },
      });
      if (freshIntent?.status === 'completed') {
        return {
          success: true,
          data: {
            paymentId: paymentIntent.id,
            provider: 'paystack',
            reference: freshIntent.providerReference || '',
            status: 'completed',
            amount: toNumber(freshIntent.amount.toString()),
            currency: freshIntent.currency,
            paidAt: freshIntent.completedAt?.toISOString(),
            transactionId: freshIntent.providerReference || undefined,
          },
        };
      }
      throw new BadRequestException('Payment verification already in progress');
    }

    try {
      const providerReference = paymentIntent.providerReference;
      if (!providerReference) {
        throw new BadRequestException('Payment provider reference not found');
      }

      const providerResponse = await this.paystackProvider.verifyPayment(providerReference);

      if (providerResponse.status === 'success') {
        await this.creditWallet(
          userId,
          toNumber(paymentIntent.amount.toString()),
          `Payment for ${paymentIntent.description}`,
          providerReference
        );

        await this.prisma.$transaction(async (tx) => {
          await tx.paymentIntent.update({
            where: { id: paymentIntent.id },
            data: {
              status: 'completed',
              completedAt: new Date(),
            },
          });
        });

        await this.trackAnalyticsEvent('payment_success', userId, {
          paymentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          providerReference: paymentIntent.providerReference,
        });

        await this.cache.invalidate(`payment:history:${userId}`);

        return {
          success: true,
          data: {
            paymentId: paymentIntent.id,
            provider: 'paystack',
            reference: paymentIntent.providerReference || '',
            status: 'completed',
            amount: toNumber(paymentIntent.amount.toString()),
            currency: paymentIntent.currency,
            paidAt: new Date().toISOString(),
            transactionId: paymentIntent.providerReference || undefined,
          },
        };
      }

      throw new BadRequestException('Payment verification failed');
    } catch (error: unknown) {
      await this.prisma.paymentIntent.update({
        where: { id: paymentIntent.id },
        data: {
          status: 'failed',
        },
      });

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Payment verification failed: ${errorMessage}`);
    } finally {
      await this.redisService.del(lockKey);
    }
  }

  async getPaymentHistory(userId: string): Promise<TransactionHistoryResponse> {
    const cacheK = cacheKey('payment', `history:${userId}`);
    const cached = await this.cache.get<TransactionHistoryResponse>(cacheK);
    if (cached) return cached;

    const payments = await this.prisma.paymentIntent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const transactions = payments.map((payment) => ({
      id: payment.id,
      type: 'payment' as const,
      amount: toNumber(payment.amount.toString()),
      currency: payment.currency,
      status: payment.status as 'pending' | 'completed' | 'failed',
      description: payment.description || '',
      createdAt: payment.createdAt.toISOString(),
    }));

    const result: TransactionHistoryResponse = {
      success: true,
      data: {
        transactions,
        total: transactions.length,
        page: 1,
        limit: 50,
      },
    };

    await this.cache.set(cacheK, result, 60);
    return result;
  }

  async getPayment(userId: string, paymentId: string): Promise<PaymentResponse> {
    const payment = await this.prisma.paymentIntent.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException(`Payment not found`);
    }

    if (payment.userId !== userId) {
      throw new BadRequestException('Invalid payment for user');
    }

    return {
      success: true,
      data: {
        id: payment.id,
        amount: toNumber(payment.amount.toString()),
        currency: payment.currency,
        status: payment.status as 'pending' | 'completed' | 'failed',
        description: payment.description || '',
        createdAt: payment.createdAt.toISOString(),
        updatedAt: payment.updatedAt.toISOString(),
      },
    };
  }

  async handleWebhook(
    body: Record<string, unknown>,
    signature?: string,
    provider: PaymentProvider = 'paystack'
  ): Promise<PaymentResponse> {
    if (!signature) {
      throw new BadRequestException('Webhook signature missing');
    }

    const paymentProvider = this.getProvider(provider);
    const isValid = paymentProvider.verifyWebhookSignature(JSON.stringify(body), signature);

    if (!isValid) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const eventId = (body.eventId as string) || (body.id as string);
    const event = (body.event as string) || (body.type as string);

    if (eventId) {
      const existingEvent = await this.prisma.webhookEvent.findUnique({
        where: { eventId },
      });
      if (existingEvent) {
        this.logger.log(
          `Webhook event ${eventId} already processed with result: ${existingEvent.result}`
        );
        return {
          success: true,
          data: { message: `Event ${eventId} already processed`, result: existingEvent.result },
        };
      }
    }

    const data = body.data as WebhookData;

    try {
      switch (event) {
        case 'charge.success':
        case 'charge.completed':
          await this.handlePaymentSuccess(data, provider);
          break;
        case 'charge.failed':
          await this.handlePaymentFailed(data, provider);
          break;
        case 'refund.success':
        case 'refund.completed':
          await this.handleRefundSuccess(data, provider);
          break;
        default:
          this.logger.warn(`Received unhandled webhook event: ${event}`);
          await this.saveWebhookEvent(eventId, provider, event, body, 'ignored');
          return {
            success: true,
            data: { message: `Event ${event} acknowledged but not processed` },
          };
      }

      await this.saveWebhookEvent(eventId, provider, event, body, 'success');
      return { success: true, data: {} };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to process webhook event ${event}:`, error);
      await this.saveWebhookEvent(eventId, provider, event, body, 'failed', errorMessage);

      if (error instanceof Error) {
        await this.webhookRetryService.scheduleRetry(eventId!, provider, event, body, error);
      }

      throw error;
    }
  }

  private async saveWebhookEvent(
    eventId: string | undefined,
    provider: string,
    type: string,
    payload: Record<string, unknown>,
    result: string,
    failureReason?: string
  ): Promise<void> {
    if (!eventId) return;

    try {
      await this.prisma.webhookEvent.create({
        data: {
          eventId,
          provider,
          type,
          // Prisma.InputJsonValue cast is required because Prisma's JSON type is overly restrictive
          payload: payload as Prisma.InputJsonValue,
          result,
          failureReason,
        },
      });
    } catch (error: unknown) {
      this.logger.warn(`Failed to save webhook event ${eventId}:`, error);
    }
  }

  async requestRefund(
    userId: string,
    transactionId: string,
    reason: string,
    idempotencyKey?: string
  ): Promise<PaymentResponse> {
    const paymentIntent = await this.prisma.paymentIntent.findUnique({
      where: { id: transactionId },
    });

    if (!paymentIntent) {
      throw new NotFoundException(`Payment not found`);
    }

    if (paymentIntent.userId !== userId) {
      throw new BadRequestException('Invalid payment for user');
    }

    if (paymentIntent.status !== 'completed') {
      throw new BadRequestException('Only completed payments can be refunded');
    }

    if (idempotencyKey) {
      const existingRefund = await this.prisma.refund.findUnique({
        where: { idempotencyKey },
      });
      if (existingRefund) {
        return {
          success: true,
          data: {
            refundId: existingRefund.id,
            amount: toNumber(existingRefund.amount.toString()),
            status: existingRefund.status,
            message:
              existingRefund.status === 'completed'
                ? 'Refund already processed'
                : 'Refund in progress',
          },
        };
      }
    }

    const refund = await this.prisma.refund.create({
      data: {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        reason,
        status: 'pending',
        idempotencyKey,
      },
    });

    try {
      const providerResponse = await this.paystackProvider.processRefund(
        paymentIntent.providerReference!,
        reason
      );

      await this.debitWallet(
        userId,
        toNumber(paymentIntent.amount.toString()),
        `Refund: ${reason}`,
        providerResponse.reference
      );

      await this.prisma.$transaction(async (tx) => {
        await tx.refund.update({
          where: { id: refund.id },
          data: {
            status: 'completed',
            providerReference: providerResponse.reference,
          },
        });

        await tx.paymentIntent.update({
          where: { id: paymentIntent.id },
          data: {
            refundAmount: paymentIntent.amount,
          },
        });
      });

      await this.trackAnalyticsEvent('refund_completed', userId, {
        refundId: refund.id,
        paymentId: paymentIntent.id,
        amount: Number(paymentIntent.amount),
        reason,
      });

      await this.cache.invalidate(`payment:history:${userId}`);

      return {
        success: true,
        data: {
          refundId: refund.id,
          amount: toNumber(paymentIntent.amount.toString()),
          status: 'completed',
          message: 'Refund processed successfully',
        },
      };
    } catch (error: unknown) {
      await this.prisma.refund.update({
        where: { id: refund.id },
        data: {
          status: 'failed',
        },
      });

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Refund failed: ${errorMessage}`);
    }
  }

  private async handlePaymentSuccess(data: WebhookData, provider: PaymentProvider): Promise<void> {
    const { reference } = data;

    const paymentIntent = await this.prisma.paymentIntent.findFirst({
      where: { providerReference: reference },
    });

    if (!paymentIntent) {
      this.logger.warn(`No payment intent found for reference: ${reference}`);
      return;
    }

    if (paymentIntent.status === 'completed') {
      this.logger.log(`Payment ${paymentIntent.id} already completed, skipping`);
      return;
    }

    // SECURITY: Use a distributed lock to prevent double-crediting from concurrent webhooks.
    // This is critical because handlePaymentSuccess is not idempotent — it credits the wallet.
    const lockKey = `payment_lock:${paymentIntent.id}`;
    const lockAcquired = await this.redisService.setIfNotExists(lockKey, '1', 60);
    if (!lockAcquired) {
      this.logger.warn(
        `Payment ${paymentIntent.id} is being processed by another request, skipping`
      );
      return;
    }

    try {
      // Re-check status after acquiring lock (another request may have completed it)
      const freshIntent = await this.prisma.paymentIntent.findUnique({
        where: { id: paymentIntent.id },
      });
      if (freshIntent?.status === 'completed') {
        this.logger.log(`Payment ${paymentIntent.id} completed by another request, skipping`);
        return;
      }

      await this.creditWallet(
        paymentIntent.userId,
        toNumber(paymentIntent.amount.toString()),
        `Payment for ${paymentIntent.description}`,
        reference,
        provider
      );

      await this.prisma.$transaction(async (tx) => {
        await tx.paymentIntent.update({
          where: { id: paymentIntent.id },
          data: {
            status: 'completed',
            completedAt: new Date(),
          },
        });
      });

      await this.trackAnalyticsEvent('payment_success', paymentIntent.userId, {
        paymentId: paymentIntent.id,
        amount: Number(paymentIntent.amount),
        provider,
        providerReference: reference,
      });

      await this.cache.invalidate(`payment:history:${paymentIntent.userId}`);
    } finally {
      await this.redisService.del(lockKey);
    }
  }

  private async handlePaymentFailed(data: WebhookData, provider: PaymentProvider): Promise<void> {
    const { reference } = data;

    const paymentIntent = await this.prisma.paymentIntent.findFirst({
      where: { providerReference: reference },
    });

    if (paymentIntent) {
      await this.prisma.paymentIntent.update({
        where: { id: paymentIntent.id },
        data: {
          status: 'failed',
        },
      });

      await this.trackAnalyticsEvent('payment_failed', paymentIntent.userId, {
        paymentId: paymentIntent.id,
        amount: Number(paymentIntent.amount),
        provider,
        providerReference: reference,
      });
    }
  }

  private async handleRefundSuccess(data: WebhookData, provider: PaymentProvider): Promise<void> {
    const { reference, transaction } = data;

    const paymentIntent = await this.prisma.paymentIntent.findFirst({
      where: { providerReference: transaction },
    });

    if (!paymentIntent) {
      this.logger.warn(`No payment intent found for transaction: ${transaction}`);
      return;
    }

    const refund = await this.prisma.refund.findFirst({
      where: { paymentIntentId: paymentIntent.id },
    });

    if (refund) {
      await this.debitWallet(
        paymentIntent.userId,
        toNumber(paymentIntent.amount.toString()),
        `Refund for payment ${paymentIntent.id}`,
        reference,
        provider
      );

      await this.prisma.refund.update({
        where: { id: refund.id },
        data: {
          status: 'completed',
          providerReference: reference,
        },
      });
    }
  }
}
