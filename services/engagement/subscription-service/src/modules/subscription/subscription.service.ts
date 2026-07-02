import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { SubscribeToPlanDto } from './dto/subscribe-to-plan.dto';

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlans(): Promise<any[]> {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
  }

  async getPlanById(id: string): Promise<any> {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException(`Subscription plan with ID ${id} not found`);
    }

    return plan;
  }

  async createPlan(dto: CreateSubscriptionPlanDto): Promise<any> {
    return this.prisma.subscriptionPlan.create({
      data: {
        ...dto,
        features: dto.features,
      },
    });
  }

  async subscribe(userId: string, dto: SubscribeToPlanDto): Promise<any> {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: dto.planId },
    });

    if (!plan) {
      throw new NotFoundException(`Plan ${dto.planId} not found`);
    }

    // Require payment reference from payment gateway
    if (!dto.paymentReference) {
      throw new BadRequestException(
        'Payment reference is required. Please complete payment first.'
      );
    }

    const subscription = await this.prisma.$transaction(async (tx) => {
      const existingSubscription = await tx.subscription.findFirst({
        where: {
          userId,
          status: 'active',
        },
      });

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

    return subscription;
  }

  async getCurrentSubscription(userId: string): Promise<any> {
    return this.prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active',
      },
      include: {
        plan: true,
      },
    });
  }

  async cancelSubscription(userId: string, subscriptionId: string): Promise<any> {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'cancelled',
        autoRenew: false,
      },
    });
  }

  async getSubscriptionHistory(userId: string, page = 1, limit = 20): Promise<any> {
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
