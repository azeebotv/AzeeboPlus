import { Inject, Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service.js';
import { CacheService, cacheKey } from '@azeebo/shared-services';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto.js';
import { SubscribeToPlanDto } from './dto/subscribe-to-plan.dto.js';
import type { SubscriptionPlan, Subscription } from '../../prisma/client/index.js';
import { CircuitBreaker, CircuitBreakerOpenError } from '@azeebo/shared-types';
import { randomUUID } from 'crypto';
import axios from 'axios';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);
  private readonly paymentServiceBaseUrl: string;
  private readonly walletServiceBaseUrl: string;
  private readonly analyticsServiceBaseUrl: string;
  private readonly circuitBreaker = new CircuitBreaker({
    failureThreshold: 5,
    resetTimeout: 60000,
  });

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CacheService) private readonly cache: CacheService,
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {
    this.paymentServiceBaseUrl = this.configService.getOrThrow<string>('PAYMENT_SERVICE_URL');
    this.walletServiceBaseUrl = this.configService.get<string>('WALLET_SERVICE_URL', 'http://wallet-service:3002');
    this.analyticsServiceBaseUrl = this.configService.get<string>('ANALYTICS_SERVICE_URL', 'http://analytics-service:3040');
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

    const paymentMethod = dto.paymentMethod ?? 'external';

    if (paymentMethod === 'external' && !dto.paymentReference) {
      throw new BadRequestException(
        'Payment reference is required for external payments. Please complete payment first.'
      );
    }

    if (paymentMethod === 'wallet') {
      await this.debitWallet(userId, Number(plan.price), `Subscription to ${plan.name}`);
    } else {
      await this.verifyExternalPayment(dto.paymentReference!, plan);
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
      endDate.setDate(endDate.getDate() + plan.duration);

      const newSubscription = await tx.subscription.create({
        data: {
          userId,
          planId: dto.planId,
          endDate,
          autoRenew: dto.autoRenew ?? true,
          lastPaymentDate: new Date(),
          paymentMethod: paymentMethod,
        },
        include: {
          plan: true,
        },
      });

      await tx.subscriptionTransaction.create({
        data: {
          subscriptionId: newSubscription.id,
          amount: plan.price,
          currency: plan.currency,
          status: 'completed',
          paymentProvider: paymentMethod === 'wallet' ? 'wallet' : 'external',
          description: `Subscription to ${plan.name}${dto.paymentReference ? ` - ref: ${dto.paymentReference}` : ''}`,
        },
      });

      return newSubscription;
    });

    await this.cache.invalidate(`subscription:user:${userId}`);
    await this.cache.invalidate('subscription:plans');

    this.trackAnalyticsEvent('subscription_created', userId, { planId: dto.planId, paymentMethod });
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
      throw new BadRequestException('Auto-renew is disabled. Please enable it first or resubscribe.');
    }

    const plan = subscription.plan;

    await this.debitWallet(userId, Number(plan.price), `Renewal of ${plan.name}`);

    const newEndDate = new Date(subscription.endDate ?? new Date());
    newEndDate.setDate(newEndDate.getDate() + plan.duration);

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          endDate: newEndDate,
          lastPaymentDate: new Date(),
          nextBillingDate: newEndDate,
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

  async updatePlan(id: string, data: Partial<Pick<SubscriptionPlan, 'name' | 'description' | 'price' | 'currency' | 'duration' | 'features' | 'tier' | 'isActive'>>): Promise<SubscriptionPlan> {
    const existing = await this.prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Subscription plan with ID ${id} not found`);
    }

    const plan = await this.prisma.subscriptionPlan.update({
      where: { id },
      data,
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
      const walletResponse = await axios.get(`${this.walletServiceBaseUrl}/wallets/user/${userId}`, {
        timeout: 10000,
      });
      const wallet = walletResponse.data?.wallet || walletResponse.data;
      if (!wallet) {
        throw new BadRequestException('Wallet not found. Please fund your wallet first.');
      }

      if (Number(wallet.balance) < amount) {
        throw new BadRequestException('Insufficient wallet balance. Please fund your wallet.');
      }

      const idempotencyKey = randomUUID();

      await axios.post(
        `${this.walletServiceBaseUrl}/wallet/debit`,
        {
          walletId: wallet.id,
          amount,
          description,
          idempotencyKey,
        },
        { timeout: 10000 }
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof CircuitBreakerOpenError) {
        throw new BadRequestException('Wallet service is temporarily unavailable. Please try again later.');
      }
      this.logger.error(`Failed to debit wallet: ${(error as Error).message}`);
      throw new BadRequestException('Unable to process wallet payment. Please try again.');
    }
  }

  private async verifyExternalPayment(paymentReference: string, plan: SubscriptionPlan): Promise<void> {
    let paymentVerification;
    try {
      paymentVerification = await this.circuitBreaker.execute(() =>
        axios.get(`${this.paymentServiceBaseUrl}/v1/payments/${paymentReference}`, {
          timeout: 10000,
        })
      );
    } catch (error) {
      if (error instanceof CircuitBreakerOpenError) {
        throw new BadRequestException(
          'Payment service is temporarily unavailable. Please try again later.'
        );
      }
      this.logger.error(`Failed to verify payment reference: ${(error as Error).message}`);
      throw new BadRequestException('Unable to verify payment. Please try again.');
    }

    if (paymentVerification.data?.status !== 'completed') {
      throw new BadRequestException(
        'Payment has not been completed. Please complete payment first.'
      );
    }

    if (Number(paymentVerification.data?.amount).toFixed(2) !== Number(plan.price).toFixed(2)) {
      throw new BadRequestException(
        `Payment amount (${paymentVerification.data?.amount}) does not match plan price (${plan.price})`
      );
    }
  }

  private async trackAnalyticsEvent(eventName: string, userId: string, metadata: Record<string, unknown> = {}): Promise<void> {
    try {
      await axios.post(`${this.analyticsServiceBaseUrl}/analytics/track`, { eventName, userId, metadata, timestamp: new Date().toISOString() }, { timeout: 10000 });
    } catch (error) { this.logger.warn(`Failed to track analytics event: ${eventName}`); }
  }
}
