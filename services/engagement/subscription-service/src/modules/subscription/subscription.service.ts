import { Inject, Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { mapAndThrow } from '@azeebo/security';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service.js';
import { CacheService, cacheKey } from '@azeebo/shared-services';
import { FeatureFlagService, subscriptionFlags } from '@azeebo/feature-flags';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto.js';
import { SubscribeToPlanDto } from './dto/subscribe-to-plan.dto.js';
import type { SubscriptionPlan, Subscription } from '../../prisma/client/index.js';
import { CircuitBreaker } from '@azeebo/shared-types';
import { randomUUID } from 'crypto';
import axios from 'axios';
import {
  walletLookupUrl,
  walletDebitUrl,
  walletDebitPayload,
  walletInternalHeaders as buildWalletInternalHeaders,
} from '../../wallet-payloads.js';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);
  private readonly paymentServiceBaseUrl: string;
  private readonly walletServiceBaseUrl: string;
  private readonly analyticsServiceBaseUrl: string;
  // Secret for internal wallet-service calls — same resolution order the
  // wallet-service InternalSecretGuard uses to validate it.
  private readonly internalApiKey: string;
  private readonly circuitBreaker = new CircuitBreaker({
    failureThreshold: 5,
    resetTimeout: 60000,
  });

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CacheService) private readonly cache: CacheService,
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(FeatureFlagService) private readonly featureFlagService: FeatureFlagService
  ) {
    this.paymentServiceBaseUrl = this.configService.getOrThrow<string>('PAYMENT_SERVICE_URL');
    this.walletServiceBaseUrl = this.configService.get<string>(
      'WALLET_SERVICE_URL',
      'http://wallet-service:3002'
    );
    this.analyticsServiceBaseUrl = this.configService.get<string>(
      'ANALYTICS_SERVICE_URL',
      'http://analytics-service:3040'
    );
    this.internalApiKey =
      this.configService.get<string>('GATEWAY_SECRET') ??
      this.configService.getOrThrow<string>('INTERNAL_API_KEY');
  }

  /**
   * Headers for internal wallet-service calls (subscription + renewal debits).
   * Those routes carry no user identity — the shared secret authenticates
   * the service itself (wallet-service InternalSecretGuard).
   */
  private walletInternalHeaders(): Record<string, string> {
    return buildWalletInternalHeaders(this.internalApiKey);
  }

  async getPlans(): Promise<SubscriptionPlan[]> {
    const cacheK = cacheKey('subscription', 'plans');
    const cached = await this.cache.get<SubscriptionPlan[]>(cacheK);
    if (cached) return cached;

    const plans = await this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
      take: 50,
    });

    await this.cache.set(cacheK, plans, 3600);
    return plans;
  }

  async getPlanById(id: string): Promise<SubscriptionPlan> {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException(`Subscription plan with ID ${id} not found`);
    }

    return plan;
  }

  async createPlan(dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    const plan = await this.prisma.subscriptionPlan.create({
      data: {
        ...dto,
        features: dto.features,
      },
    });

    await this.cache.invalidate('subscription:plans');

    return plan;
  }

  async subscribe(userId: string, dto: SubscribeToPlanDto): Promise<Subscription> {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: dto.planId },
    });

    if (!plan) {
      throw new NotFoundException(`Plan ${dto.planId} not found`);
    }

    const [freeTrialEnabled, promoEnabled] = await Promise.all([
      this.featureFlagService.isEnabled(subscriptionFlags.freeTrial, userId),
      this.featureFlagService.isEnabled(subscriptionFlags.promoDiscounts, userId),
    ]);

    // Free trial: first-time subscribers (no prior subscription record) get a
    // trial period with no charge when the flag is on.
    const hasPriorSubscription = (await this.prisma.subscription.count({ where: { userId } })) > 0;
    const isTrial = freeTrialEnabled && !hasPriorSubscription;

    // Promo discount: apply the promoCode percentage when the flag is on.
    let chargedPrice = Number(plan.price);
    let appliedPromo: { code: string; percent: number } | undefined;
    if (promoEnabled && dto.promoCode) {
      const percent = this.getPromoDiscountPercent(dto.promoCode);
      if (percent > 0) {
        chargedPrice = Number((chargedPrice * (1 - percent / 100)).toFixed(2));
        appliedPromo = { code: dto.promoCode, percent };
      }
    }

    const paymentMethod = isTrial ? 'trial' : (dto.paymentMethod ?? 'external');

    if (!isTrial) {
      if (paymentMethod === 'external' && !dto.paymentReference) {
        throw new BadRequestException(
          'Payment reference is required for external payments. Please complete payment first.'
        );
      }

      if (paymentMethod === 'wallet') {
        await this.debitWallet(userId, chargedPrice, `Subscription to ${plan.name}`);
      } else {
        await this.verifyExternalPayment(dto.paymentReference!, plan, chargedPrice);
      }
    }

    const subscription = await this.prisma.$transaction(async (tx) => {
      const existingSubscription = await tx.subscription.findFirst({
        where: {
          userId,
          status: 'active',
        },
      });

      if (existingSubscription && existingSubscription.planId === dto.planId) {
        throw new BadRequestException('You already have an active subscription to this plan');
      }

      if (existingSubscription) {
        await tx.subscription.update({
          where: { id: existingSubscription.id },
          data: { status: 'cancelled' },
        });
      }

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (isTrial ? this.getTrialDays() : plan.duration));

      const newSubscription = await tx.subscription.create({
        data: {
          userId,
          planId: dto.planId,
          endDate,
          autoRenew: dto.autoRenew ?? true,
          lastPaymentDate: isTrial ? null : new Date(),
          paymentMethod: paymentMethod,
        },
        include: {
          plan: true,
        },
      });

      await tx.subscriptionTransaction.create({
        data: {
          subscriptionId: newSubscription.id,
          amount: isTrial ? 0 : chargedPrice,
          currency: plan.currency,
          status: 'completed',
          paymentProvider: isTrial ? 'trial' : paymentMethod === 'wallet' ? 'wallet' : 'external',
          description: isTrial
            ? `Free trial of ${plan.name} (${this.getTrialDays()} days)`
            : `Subscription to ${plan.name}${appliedPromo ? ` - promo ${appliedPromo.code} (-${appliedPromo.percent}%)` : ''}${dto.paymentReference ? ` - ref: ${dto.paymentReference}` : ''}`,
        },
      });

      return newSubscription;
    });

    await this.cache.invalidate(`subscription:user:${userId}`);
    await this.cache.invalidate('subscription:plans');

    this.trackAnalyticsEvent('subscription_created', userId, {
      planId: dto.planId,
      paymentMethod,
      isTrial,
      promoCode: appliedPromo?.code,
    });
    return subscription;
  }

  async renewSubscription(userId: string, subscriptionId: string): Promise<Subscription> {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId,
        status: 'active',
      },
      include: { plan: true },
    });

    if (!subscription) {
      throw new NotFoundException('Active subscription not found');
    }

    if (!subscription.autoRenew) {
      throw new BadRequestException(
        'Auto-renew is disabled. Please enable it first or resubscribe.'
      );
    }

    const plan = subscription.plan;

    // Try wallet first, fall back to external payment
    let paymentMethod = 'wallet';
    try {
      await this.debitWallet(userId, Number(plan.price), `Renewal of ${plan.name}`);
    } catch (walletError) {
      // Wallet debit failed — try external payment if configured
      if (subscription.paymentMethod && subscription.paymentMethod !== 'wallet') {
        paymentMethod = subscription.paymentMethod;
        this.logger.log(
          `Wallet debit failed for renewal, using ${paymentMethod} for subscription ${subscriptionId}`
        );
      } else {
        throw walletError;
      }
    }

    const newEndDate = new Date(subscription.endDate ?? new Date());
    newEndDate.setDate(newEndDate.getDate() + plan.duration);

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          endDate: newEndDate,
          lastPaymentDate: new Date(),
        },
        include: { plan: true },
      });

      await tx.subscriptionTransaction.create({
        data: {
          subscriptionId,
          amount: plan.price,
          currency: plan.currency,
          status: 'completed',
          paymentProvider: 'wallet',
          description: `Renewal of ${plan.name}`,
        },
      });

      return result;
    });

    await this.cache.invalidate(`subscription:user:${userId}`);

    this.trackAnalyticsEvent('subscription_renewed', userId, { subscriptionId, planId: plan.id });
    return updated;
  }

  async checkExpiredSubscriptions(): Promise<number> {
    const now = new Date();

    const result = await this.prisma.subscription.updateMany({
      where: {
        status: 'active',
        endDate: { lt: now },
      },
      data: {
        status: 'expired',
      },
    });

    if (result.count > 0) {
      this.logger.log(`Marked ${result.count} subscriptions as expired`);
      await this.cache.invalidate('subscription:');
    }

    return result.count;
  }

  async getCurrentSubscription(userId: string): Promise<Subscription | null> {
    const cacheK = cacheKey('subscription', `user:${userId}`);
    const cached = await this.cache.get<Subscription>(cacheK);
    if (cached !== undefined && cached !== null) return cached;

    const result = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active',
      },
      include: {
        plan: true,
      },
    });

    await this.cache.set(cacheK, result, 300);
    return result;
  }

  async cancelSubscription(userId: string, subscriptionId: string): Promise<Subscription> {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const result = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'cancelled',
        autoRenew: false,
      },
    });

    await this.cache.invalidate(`subscription:user:${userId}`);

    this.trackAnalyticsEvent('subscription_cancelled', userId, { subscriptionId });
    return result;
  }

  async updatePlan(
    id: string,
    data: Partial<
      Pick<
        SubscriptionPlan,
        'name' | 'description' | 'currency' | 'duration' | 'features' | 'tier' | 'isActive'
      >
    > & { price?: string | number }
  ): Promise<SubscriptionPlan> {
    const existing = await this.prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Subscription plan with ID ${id} not found`);
    }

    const updateData: Record<string, unknown> = { ...data };
    if (data.price !== undefined) {
      updateData.price = String(data.price);
    }

    const plan = await this.prisma.subscriptionPlan.update({
      where: { id },
      data: updateData,
    });

    await this.cache.invalidate('subscription:plans');
    return plan;
  }

  async deletePlan(id: string): Promise<void> {
    const existing = await this.prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Subscription plan with ID ${id} not found`);
    }

    const activeSubscriptions = await this.prisma.subscription.count({
      where: { planId: id, status: 'active' },
    });

    if (activeSubscriptions > 0) {
      throw new BadRequestException(
        `Cannot delete plan with ${activeSubscriptions} active subscription(s). Deactivate instead.`
      );
    }

    await this.prisma.subscriptionPlan.delete({ where: { id } });
    await this.cache.invalidate('subscription:plans');
  }

  async getSubscriptionHistory(
    userId: string,
    page = 1,
    limit = 20
  ): Promise<{
    subscriptions: Subscription[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const skip = (page - 1) * limit;

    const [subscriptions, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where: { userId },
        include: { plan: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.subscription.count({ where: { userId } }),
    ]);

    return {
      subscriptions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async debitWallet(userId: string, amount: number, description: string): Promise<void> {
    try {
      const walletResponse = await axios.get(
        walletLookupUrl(this.walletServiceBaseUrl, userId),
        { headers: this.walletInternalHeaders(), timeout: 10000 }
      );
      // Internal lookup responds enveloped: { success, data: { balance, … } }.
      const wallet = walletResponse.data?.data;
      if (!wallet) {
        throw new BadRequestException('Wallet not found. Please fund your wallet first.');
      }

      if (Number(wallet.balance) < amount) {
        throw new BadRequestException('Insufficient wallet balance. Please fund your wallet.');
      }

      const idempotencyKey = randomUUID();

      await axios.post(
        walletDebitUrl(this.walletServiceBaseUrl, userId),
        walletDebitPayload(amount, description, idempotencyKey),
        { headers: this.walletInternalHeaders(), timeout: 10000 }
      );
    } catch (error) {
      mapAndThrow(error, 'debiting wallet');
    }
  }

  private async verifyExternalPayment(
    paymentReference: string,
    plan: SubscriptionPlan,
    chargedPrice?: number
  ): Promise<void> {
    let paymentVerification;
    try {
      paymentVerification = await this.circuitBreaker.execute(() =>
        axios.get(`${this.paymentServiceBaseUrl}/v1/payments/${paymentReference}`, {
          timeout: 10000,
        })
      );
    } catch (error) {
      mapAndThrow(error, 'verifying payment');
    }

    if (paymentVerification.data?.status !== 'completed') {
      throw new BadRequestException(
        'Payment has not been completed. Please complete payment first.'
      );
    }

    const expected = chargedPrice ?? Number(plan.price);
    if (Number(paymentVerification.data?.amount).toFixed(2) !== expected.toFixed(2)) {
      throw new BadRequestException(
        `Payment amount (${paymentVerification.data?.amount}) does not match expected amount (${expected})`
      );
    }
  }

  /**
   * Free trial length in days (subscription_free_trial flag). Env-tunable via
   * SUBSCRIPTION_TRIAL_DAYS, default 7.
   */
  private getTrialDays(): number {
    const days = parseInt(this.configService.get<string>('SUBSCRIPTION_TRIAL_DAYS', '7'), 10);
    return Number.isFinite(days) && days > 0 ? days : 7;
  }

  /**
   * Promo registry (subscription_promo_discounts flag): a JSON map of code →
   * discount percentage from the SUBSCRIPTION_PROMO_CODES env var, e.g.
   * `{"LAUNCH10": 10, "WELCOME20": 20}`. Unknown/expired codes return 0.
   */
  private getPromoDiscountPercent(promoCode: string): number {
    try {
      const raw = this.configService.get<string>('SUBSCRIPTION_PROMO_CODES', '{}');
      const registry = JSON.parse(raw) as Record<string, number>;
      const percent = registry[promoCode];
      return typeof percent === 'number' && percent > 0 && percent <= 100 ? percent : 0;
    } catch {
      return 0;
    }
  }

  private async trackAnalyticsEvent(
    eventName: string,
    userId: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    try {
      await axios.post(
        `${this.analyticsServiceBaseUrl}/analytics/track`,
        { eventName, userId, metadata, timestamp: new Date().toISOString() },
        { timeout: 10000 }
      );
    } catch (error) {
      this.logger.warn(`Failed to track analytics event: ${eventName}`);
    }
  }
}
