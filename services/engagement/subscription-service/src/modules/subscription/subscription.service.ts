import { Inject, Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service.js';
import { CacheService, cacheKey } from '@azeebo/shared-services';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto.js';
import { SubscribeToPlanDto } from './dto/subscribe-to-plan.dto.js';
import type { SubscriptionPlan, Subscription } from '@prisma/client';
import { CircuitBreaker, CircuitBreakerOpenError } from '@azeebo/shared-types';
import axios from 'axios';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);
  private readonly paymentServiceBaseUrl: string;
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

    if (!dto.paymentReference) {
      throw new BadRequestException(
        'Payment reference is required. Please complete payment first.'
      );
    }

    let paymentVerification;
    try {
      paymentVerification = await this.circuitBreaker.execute(() =>
        axios.get(`${this.paymentServiceBaseUrl}/v1/payments/${dto.paymentReference}`, {
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
          paymentMethod: dto.paymentMethod,
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
          description: `Subscription to ${plan.name} - Payment ref: ${dto.paymentReference}`,
        },
      });

      return newSubscription;
    });

    await this.cache.invalidate(`subscription:user:${userId}`);
    await this.cache.invalidate('subscription:plans');

    return subscription;
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

    return result;
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
}
