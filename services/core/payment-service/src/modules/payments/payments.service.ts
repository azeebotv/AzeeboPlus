import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service.js';
import { InitializePaymentDto } from './dto/initialize-payment.dto.js';
import { PaystackProvider } from './providers/paystack.provider.js';
import { FlutterwaveProvider } from './providers/flutterwave.provider.js';
import { WebhookRetryService } from './webhook-retry.service.js';
import { RedisService, CacheService, cacheKey } from '@azeebo/shared-services';
import axios from 'axios';
import { Prisma } from '../../prisma/client/index.js';
import {
  PaymentResponse,
  InitializePaymentResponse,
  VerifyPaymentResponse,
  TransactionHistoryResponse,
} from './interfaces/payment-response.interface.js';
import { toNumber } from '@azeebo/utils';
import { mapAndThrow } from '@azeebo/security';
import { FeatureFlagService, paymentFlags } from '@azeebo/feature-flags';
import { tryUpdatePaymentIntent } from './payment-intent.optimistic-lock.js';

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
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(FeatureFlagService) private readonly featureFlagService: FeatureFlagService
  ) {
    this.analyticsServiceBaseUrl = this.configService.getOrThrow<string>('ANALYTICS_SERVICE_URL');
    this.walletServiceBaseUrl = this.configService.getOrThrow<string>('WALLET_SERVICE_URL');
    this.MIN_PAYMENT_AMOUNT_NGN = this.configService.get<number>('MIN_PAYMENT_AMOUNT_NGN', 100);
  }

  private getProvider(provider: PaymentProvider) {
    return provider === 'paystack' ? this.paystackProvider : this.flutterwaveProvider;
  }

  /**
   * Resolves the active payment gateway from feature flags. Both providers
   * default ON so ops can fail over between gateways (or freeze both) without
   * a deploy. Returns the fallback chain: paystack → flutterwave.
   *
   * The evaluation is rollout-aware: the user's id is passed as the bucketing
   * key, so a stored `rolloutPercentage` on the provider flags performs an A/B
   * traffic split between gateways (e.g. paystack at 50% routes that share of
   * users to paystack and the rest to flutterwave, hash-bucketed per user).
   * Targeted-user lists on the flags also take effect per user.
   */
  private async getActiveProvider(userId?: string): Promise<PaymentProvider> {
    const [paystackEnabled, flutterwaveEnabled] = await Promise.all([
      this.featureFlagService.isEnabled(paymentFlags.providerPaystack, userId),
      this.featureFlagService.isEnabled(paymentFlags.providerFlutterwave, userId),
    ]);
    if (paystackEnabled) {
      return 'paystack';
    }
    if (flutterwaveEnabled) {
      return 'flutterwave';
    }
    throw new BadRequestException('Payment processing is temporarily unavailable');
  }

  /**
   * Initializes a checkout with automatic provider failover.
   *
   * Tries the flag-preferred provider (the fallback chain is paystack →
   * flutterwave); when the primary provider call fails (provider down / 5xx /
   * circuit breaker open), falls back to the OTHER provider when its flag is
   * also enabled for the user. The intent is only marked failed when both
   * providers fail — the primary error is surfaced (not the fallback's) so
   * the failure the user was actually routed to isn't masked.
   *
   * Every failover emits a `payment_provider_failover` analytics event
   * ({from, to, reason, amount, currency}) so ops can see provider health
   * degrade before customers do.
   */
  private async initializeWithFailover(
    userId: string,
    amount: number,
    currency: string
  ): Promise<{ provider: PaymentProvider; response: ProviderResponse }> {
    const active = await this.getActiveProvider(userId);

    try {
      return {
        provider: active,
        response: await this.getProvider(active).initializePayment(amount, currency, userId),
      };
    } catch (error: unknown) {
      const fallback: PaymentProvider = active === 'paystack' ? 'flutterwave' : 'paystack';
      const fallbackFlag =
        fallback === 'paystack' ? paymentFlags.providerPaystack : paymentFlags.providerFlutterwave;
      const fallbackEnabled = await this.featureFlagService.isEnabled(fallbackFlag, userId);
      if (!fallbackEnabled) {
        throw error;
      }

      const reason = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Payment provider ${active} failed (${reason}); failing over to ${fallback}`
      );
      try {
        const response = await this.getProvider(fallback).initializePayment(
          amount,
          currency,
          userId
        );
        await this.trackAnalyticsEvent('payment_provider_failover', userId, {
          from: active,
          to: fallback,
          reason,
          amount,
          currency,
        });
        return { provider: fallback, response };
      } catch {
        // Both providers down — surface the primary provider's error.
        throw error;
      }
    }
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
    initializePaymentDto: InitializePaymentDto,
    kycVerified = false
  ): Promise<InitializePaymentResponse> {
    const { amount, currency, description, metadata, idempotencyKey } = initializePaymentDto;

    // Deposit gating: when payment_kyc_required is on, unverified users are
    // rejected before any intent is created. Fail-closed (no KYC claim in the
    // JWT ⇒ blocked), so ops flips this only after KYC is rolled out.
    if (await this.featureFlagService.isEnabled(paymentFlags.kycRequired, userId)) {
      if (!kycVerified) {
        throw new ForbiddenException('KYC verification required before payment');
      }
    }

    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    if (currency === 'NGN' && amount < this.MIN_PAYMENT_AMOUNT_NGN) {
      throw new BadRequestException(
        `Minimum payment amount for NGN is ${this.MIN_PAYMENT_AMOUNT_NGN}`
      );
    }

    if (idempotencyKey) {
      // First check cache for speed, then DB for consistency
      const cached = await this.cache.get(idempotencyKey);
      if (cached) {
        const existingPayment = await this.prisma.paymentIntent.findUnique({
          where: { idempotencyKey },
        });
        const existingStatus =
          existingPayment?.status === 'processing' ? 'pending' : existingPayment?.status;
        return {
          success: true,
          data: {
            paymentId: existingPayment?.id ?? '',
            provider: 'paystack',
            checkoutUrl: '',
            reference: existingPayment?.providerReference ?? '',
            amount: Number(existingPayment?.amount ?? 0),
            currency: existingPayment?.currency ?? 'NGN',
            status: existingStatus as 'pending' | 'completed' | 'failed',
            createdAt: existingPayment?.createdAt.toISOString() ?? '',
          },
        };
      }

      // Store short-lived cache to prevent race conditions
      await this.cache.set(idempotencyKey, 'true', 1800); // 30 min TTL
    }

    // New checkout flow: when payment_new_checkout_flow is on, the intent gets
    // a 30-minute session expiry (stored in metadata) and the response carries
    // it; verifyPayment rejects expired sessions.
    const newCheckoutFlow = await this.featureFlagService.isEnabled(
      paymentFlags.newCheckoutFlow,
      userId
    );
    const checkoutExpiresAt = newCheckoutFlow
      ? new Date(Date.now() + 30 * 60 * 1000).toISOString()
      : undefined;

    const paymentIntent = await this.prisma.paymentIntent.create({
      data: {
        userId,
        amount,
        currency: currency || 'NGN',
        status: 'pending',
        description,
        // Prisma.InputJsonValue cast is required because Prisma's JSON type is overly restrictive
        metadata: {
          ...(metadata || {}),
          ...(checkoutExpiresAt ? { checkoutExpiresAt } : {}),
        } as Prisma.InputJsonValue,
        idempotencyKey,
      },
    });

    try {
      const { provider: activeProvider, response: providerResponse } =
        await this.initializeWithFailover(userId, amount, currency || 'NGN');

      const marked = await tryUpdatePaymentIntent(
        this.prisma,
        paymentIntent.id,
        paymentIntent.version,
        {
          providerReference: providerResponse.reference,
          status: 'processing',
        }
      );
      if (!marked) {
        // The intent was just created by this call, so a stale write means
        // something else raced it — surface the conflict instead of proceeding.
        throw new ConflictException(
          'Payment intent was modified concurrently; retry initialization'
        );
      }

      return {
        success: true,
        data: {
          paymentId: paymentIntent.id,
          provider: activeProvider,
          checkoutUrl: providerResponse.authorizationUrl,
          reference: providerResponse.reference,
          amount,
          currency: currency || 'NGN',
          status: 'pending',
          createdAt: paymentIntent.createdAt.toISOString(),
          ...(checkoutExpiresAt ? { expiresAt: checkoutExpiresAt } : {}),
        },
      };
    } catch (error: unknown) {
      const markedFailed = await tryUpdatePaymentIntent(
        this.prisma,
        paymentIntent.id,
        paymentIntent.version,
        {
          status: 'failed',
        }
      );
      if (!markedFailed) {
        this.logger.warn(
          `Payment intent ${paymentIntent.id} was modified concurrently; skipped failed-mark`
        );
      }

      mapAndThrow(error, 'initializing payment');
    }
  }

  /**
   * Intents API (`payment_intents_api` flag): creates a payment intent WITHOUT
   * calling the provider — deferred authorization. The client later confirms
   * via confirmIntent to get the provider checkout URL. Fail-closed gate: the
   * intent is only created when the flag is on.
   */
  async createIntent(
    userId: string,
    initializePaymentDto: InitializePaymentDto
  ): Promise<PaymentResponse> {
    const { amount, currency, description, metadata, idempotencyKey } = initializePaymentDto;

    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const intentsEnabled = await this.featureFlagService.isEnabled(paymentFlags.intentsApi, userId);
    if (!intentsEnabled) {
      throw new ForbiddenException('Payment intents API is not enabled');
    }

    if (idempotencyKey) {
      const existing = await this.prisma.paymentIntent.findUnique({
        where: { idempotencyKey },
      });
      if (existing) {
        return {
          success: true,
          data: {
            intentId: existing.id,
            status: existing.status === 'processing' ? 'requires_confirmation' : existing.status,
            amount: Number(existing.amount),
            currency: existing.currency,
          },
        };
      }
    }

    const paymentIntent = await this.prisma.paymentIntent.create({
      data: {
        userId,
        amount,
        currency: currency || 'NGN',
        status: 'requires_payment',
        description,
        // Prisma.InputJsonValue cast is required because Prisma's JSON type is overly restrictive
        metadata: (metadata || {}) as Prisma.InputJsonValue,
        idempotencyKey,
      },
    });

    return {
      success: true,
      data: {
        intentId: paymentIntent.id,
        status: 'requires_payment',
        amount: Number(paymentIntent.amount),
        currency: paymentIntent.currency,
        createdAt: paymentIntent.createdAt.toISOString(),
      },
    };
  }

  /**
   * Intents API: confirms a previously created intent by calling the active
   * provider, returning the checkout URL the client redirects to.
   */
  async confirmIntent(userId: string, intentId: string): Promise<PaymentResponse> {
    const paymentIntent = await this.prisma.paymentIntent.findUnique({
      where: { id: intentId },
    });

    if (!paymentIntent) {
      throw new NotFoundException('Payment intent not found');
    }
    if (paymentIntent.userId !== userId) {
      throw new BadRequestException('Invalid payment intent for user');
    }
    if (paymentIntent.status !== 'requires_payment') {
      throw new BadRequestException('Payment intent is not awaiting confirmation');
    }

    try {
      const { provider: activeProvider, response: providerResponse } =
        await this.initializeWithFailover(
          userId,
          Number(paymentIntent.amount),
          paymentIntent.currency
        );

      const marked = await tryUpdatePaymentIntent(
        this.prisma,
        paymentIntent.id,
        paymentIntent.version,
        {
          providerReference: providerResponse.reference,
          status: 'processing',
        }
      );
      if (!marked) {
        // A concurrent confirm already transitioned this intent — reject the
        // stale confirmation (the provider initialize call is idempotent, but
        // the intent bookkeeping must not be double-written).
        throw new ConflictException('Payment intent was modified concurrently; retry confirmation');
      }

      return {
        success: true,
        data: {
          intentId: paymentIntent.id,
          provider: activeProvider,
          checkoutUrl: providerResponse.authorizationUrl,
          reference: providerResponse.reference,
          status: 'requires_confirmation',
        },
      };
    } catch (error: unknown) {
      // mapAndThrow rethrows the in-try stale-write Conflict unchanged, so the
      // client still retries against current state instead of a generic 400.
      mapAndThrow(error, 'confirming payment intent');
    }
  }

  async verifyPayment(userId: string, idOrReference: string): Promise<VerifyPaymentResponse> {
    // Callers hold either the intent id (from /initialize) or the provider
    // reference the checkout hands back in its return URL. Try the id first —
    // it is the documented handle and resolves in one lookup — then the
    // reference, scoped to the caller so it cannot match someone else's
    // payment. Before this, a reference 404'd before it was ever looked up.
    const paymentIntent =
      (await this.prisma.paymentIntent.findUnique({ where: { id: idOrReference } })) ??
      (await this.prisma.paymentIntent.findFirst({
        where: { userId, providerReference: idOrReference },
      }));

    if (!paymentIntent) {
      throw new NotFoundException(`Payment not found`);
    }

    if (paymentIntent.userId !== userId) {
      throw new BadRequestException('Invalid payment for user');
    }

    // New checkout flow sessions expire 30 minutes after initialization.
    const metadataJson = (paymentIntent.metadata ?? {}) as Record<string, unknown>;
    if (metadataJson.checkoutExpiresAt) {
      const expiresAt = new Date(metadataJson.checkoutExpiresAt as string).getTime();
      if (Number.isNaN(expiresAt) || expiresAt < Date.now()) {
        throw new BadRequestException(
          'Checkout session has expired, please initialize a new payment'
        );
      }
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

      const activeProvider = await this.getActiveProvider(userId);
      const providerResponse =
        await this.getProvider(activeProvider).verifyPayment(providerReference);

      if (providerResponse.status === 'success') {
        await this.creditWallet(
          userId,
          toNumber(paymentIntent.amount.toString()),
          `Payment for ${paymentIntent.description}`,
          providerReference
        );

        // Optimistic-concurrency claim on the version column: only the writer
        // whose read is still current may transition to 'completed' (and thus
        // be the one that reports success). A stale claim means a concurrent
        // writer already transitioned the intent.
        let claimed = false;
        await this.prisma.$transaction(async (tx) => {
          claimed = await tryUpdatePaymentIntent(tx, paymentIntent.id, paymentIntent.version, {
            status: 'completed',
            completedAt: new Date(),
          });
        });
        if (!claimed) {
          const fresh = await this.prisma.paymentIntent.findUnique({
            where: { id: paymentIntent.id },
          });
          if (fresh?.status === 'completed') {
            // A concurrent request completed + credited it — idempotent success.
            return {
              success: true,
              data: {
                paymentId: fresh.id,
                provider: 'paystack',
                reference: fresh.providerReference || '',
                status: 'completed',
                amount: toNumber(fresh.amount.toString()),
                currency: fresh.currency,
                paidAt: fresh.completedAt?.toISOString(),
                transactionId: fresh.providerReference || undefined,
              },
            };
          }
          throw new ConflictException('Payment was modified concurrently; retry verification');
        }

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
      // A stale-write Conflict must not be swallowed by the generic failure
      // path — and must not get a stale failed-mark either.
      if (error instanceof ConflictException) {
        throw error;
      }
      const markedFailed = await tryUpdatePaymentIntent(
        this.prisma,
        paymentIntent.id,
        paymentIntent.version,
        {
          status: 'failed',
        }
      );
      if (!markedFailed) {
        this.logger.warn(
          `Payment intent ${paymentIntent.id} was modified concurrently; skipped failed-mark`
        );
      }

      mapAndThrow(error, 'verifying payment');
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
      const activeProvider = await this.getActiveProvider(userId);
      const providerResponse = await this.getProvider(activeProvider).processRefund(
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

        const marked = await tryUpdatePaymentIntent(tx, paymentIntent.id, paymentIntent.version, {
          refundAmount: paymentIntent.amount,
        });
        if (!marked) {
          throw new ConflictException('Payment intent was modified concurrently; retry the refund');
        }
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

      mapAndThrow(error, 'processing refund');
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

      // Optimistic-concurrency claim: only the writer whose read is current
      // may transition to 'completed'. The wallet credit above is idempotent
      // (deduped by reference at the wallet service), so a stale claim just
      // means a concurrent writer already completed this payment — skip.
      let claimed = false;
      await this.prisma.$transaction(async (tx) => {
        claimed = await tryUpdatePaymentIntent(tx, paymentIntent.id, paymentIntent.version, {
          status: 'completed',
          completedAt: new Date(),
        });
      });
      if (!claimed) {
        this.logger.warn(
          `Payment ${paymentIntent.id} was completed by a concurrent writer; skipping`
        );
        return;
      }

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
      const marked = await tryUpdatePaymentIntent(
        this.prisma,
        paymentIntent.id,
        paymentIntent.version,
        {
          status: 'failed',
        }
      );
      if (!marked) {
        // A concurrent writer (e.g. charge.success) already transitioned the
        // intent — don't clobber a completed row with a stale failed-mark.
        this.logger.warn(
          `Payment intent ${paymentIntent.id} was modified concurrently; skipped failed-mark`
        );
        return;
      }

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
