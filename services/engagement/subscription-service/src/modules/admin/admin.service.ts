import { Inject, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { SubscriptionPlan } from '../../prisma/client/index.js';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getStats(): Promise<{
    totalPlans: number;
    activePlans: number;
    totalSubscriptions: number;
    activeSubscriptions: number;
    cancelledSubscriptions: number;
    expiredSubscriptions: number;
  }> {
    const [
      totalPlans,
      activePlans,
      totalSubscriptions,
      activeSubscriptions,
      cancelledSubscriptions,
      expiredSubscriptions,
    ] = await Promise.all([
      this.prisma.subscriptionPlan.count(),
      this.prisma.subscriptionPlan.count({ where: { isActive: true } }),
      this.prisma.subscription.count(),
      this.prisma.subscription.count({ where: { status: 'active' } }),
      this.prisma.subscription.count({ where: { status: 'cancelled' } }),
      this.prisma.subscription.count({ where: { status: 'expired' } }),
    ]);

    return {
      totalPlans,
      activePlans,
      totalSubscriptions,
      activeSubscriptions,
      cancelledSubscriptions,
      expiredSubscriptions,
    };
  }

  async getPlans(): Promise<SubscriptionPlan[]> {
    return this.prisma.subscriptionPlan.findMany({
      orderBy: { createdAt: 'desc' },
    });
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

    this.logger.log(`Updating plan ${id}`);

    const updateData: Record<string, unknown> = { ...data };
    if (data.price !== undefined) {
      updateData.price = String(data.price);
    }

    return this.prisma.subscriptionPlan.update({
      where: { id },
      data: updateData,
    });
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
      throw new NotFoundException(
        `Cannot delete plan with ${activeSubscriptions} active subscription(s). Deactivate instead.`
      );
    }

    this.logger.log(`Deleting plan ${id}`);

    await this.prisma.subscriptionPlan.delete({ where: { id } });
  }
}
