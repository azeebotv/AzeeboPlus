import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { upstreamAuthContext } from '../../common/upstream-auth.middleware';

export interface SubscriptionPlanItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  durationDays: number;
  tier: 'free' | 'basic' | 'standard' | 'premium' | 'enterprise';
  status: 'active' | 'inactive' | 'archived';
  features: string[];
  maxContentAccess?: number;
  maxUsers?: number;
  subscriberCount: number;
  createdAt: string;
  updatedAt: string;
}

interface UpstreamPlan {
  id: string;
  name: string;
  description?: string;
  price: string | number;
  currency: string;
  duration: number;
  features: string[];
  tier: string;
  isActive: boolean;
  maxDevices?: number;
  maxStreams?: number;
  subscriberCount?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Admin subscriptions — a live proxy to subscription-service's real admin
 * endpoints (its DB is the source of truth users actually subscribe against).
 * The previous implementation read a shadow plan store in system_settings and
 * returned fabricated stats (12,450 subscribers, invented churn/revenue) —
 * neither matched what the platform serves. Upstream identity flows from
 * UpstreamAuthMiddleware's request-scoped context; real per-plan subscriber
 * counts come from the upstream groupBy. Revenue metrics are derived from the
 * admin DB's federated paymentIntent table and are honest zeros in dev.
 */
@Injectable()
export class SubscriptionAdminService {
  private readonly logger = new Logger(SubscriptionAdminService.name);

  private get upstreamBase(): string {
    const url = process.env.SUBSCRIPTION_SERVICE_URL || 'http://localhost:3026';
    return `${url}/v1/admin`;
  }

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private upstreamHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const auth = upstreamAuthContext.getStore();
    if (auth?.authorization) {
      headers['authorization'] = auth.authorization;
    } else if (auth?.userId) {
      headers['x-user-id'] = auth.userId;
      if (auth.email) headers['x-user-email'] = auth.email;
      if (auth.role) headers['x-user-role'] = auth.role;
      if (auth.gatewaySecret) headers['x-gateway-secret'] = auth.gatewaySecret;
    }
    return headers;
  }

  private async upstream<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.upstreamBase}${path}`, {
      ...init,
      headers: { ...this.upstreamHeaders(), ...(init?.headers || {}) },
    });
    const body = (await res.json().catch(() => null)) as
      | { success?: boolean; data?: T; message?: string }
      | null;
    if (!res.ok || !body) {
      // Upstream rate limits are protective, not failures — surface them as
      // such instead of an opaque 502 (the delete route allows 5/min).
      if (res.status === 429) {
        throw new Error('Upstream rate limit reached — wait a few seconds and retry.');
      }
      throw new Error(body?.message || `subscription-service ${path} failed (${res.status})`);
    }
    // Upstream wraps in ResponseWrapperInterceptor ({success, data}).
    return (body.data !== undefined ? body.data : (body as unknown)) as T;
  }

  private mapPlan(p: UpstreamPlan): SubscriptionPlanItem {
    return {
      id: p.id,
      name: p.name,
      description: p.description ?? '',
      price: Number(p.price),
      currency: p.currency,
      durationDays: p.duration,
      tier: (p.tier as SubscriptionPlanItem['tier']) ?? 'basic',
      status: p.isActive ? 'active' : 'inactive',
      features: p.features ?? [],
      maxUsers: p.maxDevices,
      subscriberCount: p.subscriberCount ?? 0,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  async getSubscriptionStats() {
    const [upstreamStats, revenueAgg] = await Promise.all([
      this.upstream<{
        totalPlans: number;
        activePlans: number;
        totalSubscriptions: number;
        activeSubscriptions: number;
        cancelledSubscriptions: number;
        expiredSubscriptions: number;
      }>('/stats').catch((e) => {
        this.logger.warn(`upstream stats unavailable: ${e instanceof Error ? e.message : e}`);
        return null;
      }),
      this.prisma.paymentIntent
        .aggregate({
          where: { status: 'completed' },
          _sum: { amount: true },
          _count: true,
        })
        .catch(() => ({ _sum: { amount: 0 }, _count: 0 })),
    ]);

    const totalRevenue = Number(revenueAgg._sum?.amount || 0);
    const payingUsers = Number(revenueAgg._count || 0);

    if (!upstreamStats) {
      // Upstream down — honest zeros, never fabricated numbers.
      return {
        totalActiveSubscriptions: 0,
        totalRevenue: 0,
        monthlyRecurringRevenue: 0,
        churnRate: 0,
        averageRevenuePerUser: 0,
        activePlans: 0,
      };
    }

    return {
      totalActiveSubscriptions: upstreamStats.activeSubscriptions,
      totalRevenue,
      monthlyRecurringRevenue: totalRevenue,
      churnRate:
        upstreamStats.totalSubscriptions > 0
          ? (upstreamStats.cancelledSubscriptions / upstreamStats.totalSubscriptions) * 100
          : 0,
      averageRevenuePerUser: payingUsers > 0 ? totalRevenue / payingUsers : 0,
      activePlans: upstreamStats.activePlans,
    };
  }

  async getSubscriptionPlans(query: {
    page?: number;
    limit?: number;
    status?: string;
    tier?: string;
  }) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 15);

    const upstreamPlans = await this.upstream<UpstreamPlan[]>('/plans');
    let plans = upstreamPlans.map((p) => this.mapPlan(p));

    if (query.status) plans = plans.filter((p) => p.status === query.status);
    if (query.tier) plans = plans.filter((p) => p.tier === query.tier);

    const total = plans.length;
    const startIndex = (page - 1) * limit;
    const paginatedItems = plans.slice(startIndex, startIndex + limit);

    return {
      items: paginatedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getSubscriptionPlanById(id: string) {
    const upstreamPlans = await this.upstream<UpstreamPlan[]>('/plans');
    const found = upstreamPlans.find((p) => p.id === id);
    if (!found) {
      throw new NotFoundException(`Subscription plan ${id} not found`);
    }
    return this.mapPlan(found);
  }

  async createSubscriptionPlan(data: Record<string, unknown>) {
    const upstream = await this.upstream<UpstreamPlan>('/plans', {
      method: 'POST',
      body: JSON.stringify({
        name: String(data.name || 'New Plan'),
        description: String(data.description || ''),
        price: Number(data.price || 0),
        currency: String(data.currency || 'NGN'),
        duration: Number(data.durationDays || data.duration || 30),
        features: Array.isArray(data.features)
          ? data.features.map(String)
          : typeof data.features === 'string'
            ? (data.features as string).split(',').map((f) => f.trim()).filter(Boolean)
            : [],
        tier: String(data.tier || 'basic'),
        isActive: data.status ? data.status === 'active' : true,
      }),
    });
    return this.mapPlan(upstream);
  }

  async updateSubscriptionPlan(id: string, data: Record<string, unknown>, actorId?: string) {
    const payload: Record<string, unknown> = {};
    if (data.name !== undefined) payload.name = String(data.name);
    if (data.description !== undefined) payload.description = String(data.description);
    if (data.price !== undefined) payload.price = Number(data.price);
    if (data.currency !== undefined) payload.currency = String(data.currency);
    if (data.durationDays !== undefined) payload.duration = Number(data.durationDays);
    if (data.tier !== undefined) payload.tier = String(data.tier);
    if (data.features !== undefined) {
      payload.features = Array.isArray(data.features)
        ? data.features.map(String)
        : typeof data.features === 'string'
          ? (data.features as string).split(',').map((f) => f.trim()).filter(Boolean)
          : [];
    }
    if (data.isActive !== undefined) payload.isActive = data.isActive === true;
    else if (data.status !== undefined) payload.isActive = data.status === 'active';

    const upstream = await this.upstream<UpstreamPlan>(`/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    void actorId;
    return this.mapPlan(upstream);
  }

  async deleteSubscriptionPlan(id: string, actorId?: string) {
    await this.upstream(`/plans/${id}`, { method: 'DELETE' });
    void actorId;
    return { message: 'Plan deleted' };
  }

  async toggleSubscriptionPlanStatus(id: string, status: string, actorId?: string) {
    return this.updateSubscriptionPlan(id, { status }, actorId);
  }

  // ─── Promo Codes (interim storage in system_settings) ─────────────────────────

  private async readPromoCodes(): Promise<any[]> {
    const key = 'subscription.promo_codes';
    const row = await this.prisma.systemSettings.findUnique({ where: { key } });
    if (!row || !Array.isArray(row.value)) return [];
    return row.value;
  }

  private async writePromoCodes(codes: any[]): Promise<void> {
    const key = 'subscription.promo_codes';
    const existing = await this.prisma.systemSettings.findUnique({ where: { key } });
    if (existing) {
      await this.prisma.systemSettings.update({
        where: { key },
        data: { value: codes },
      });
    } else {
      await this.prisma.systemSettings.create({
        data: {
          key,
          value: codes,
          category: 'monetization',
          description: 'Promotional discount codes for subscription memberships',
          isPublic: false,
        },
      });
    }
  }

  async getPromoCodes() {
    const codes = await this.readPromoCodes();
    return { items: codes, total: codes.length };
  }

  async createPromoCode(data: {
    code: string;
    discountType: 'percent' | 'flat';
    discountValue: number;
    maxUses?: number | null;
    expiresAt?: string | null;
    applicablePlanIds?: string[];
  }) {
    const codes = await this.readPromoCodes();
    const cleanCode = data.code.trim().toUpperCase();
    if (codes.some((c) => c.code === cleanCode)) {
      throw new Error(`Promo code "${cleanCode}" already exists`);
    }

    const newCode = {
      id: `promo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      code: cleanCode,
      discountType: data.discountType || 'percent',
      discountValue: Number(data.discountValue || 0),
      maxUses: data.maxUses ? Number(data.maxUses) : null,
      usedCount: 0,
      expiresAt: data.expiresAt || null,
      status: 'active',
      applicablePlanIds: data.applicablePlanIds || [],
      createdAt: new Date().toISOString(),
    };

    codes.unshift(newCode);
    await this.writePromoCodes(codes);
    return newCode;
  }

  async expirePromoCode(id: string) {
    const codes = await this.readPromoCodes();
    const target = codes.find((c) => c.id === id);
    if (!target) throw new NotFoundException(`Promo code ${id} not found`);
    target.status = 'expired';
    await this.writePromoCodes(codes);
    return target;
  }

  async deletePromoCode(id: string) {
    let codes = await this.readPromoCodes();
    codes = codes.filter((c) => c.id !== id);
    await this.writePromoCodes(codes);
    return { success: true };
  }
}

