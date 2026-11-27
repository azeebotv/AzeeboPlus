import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { InputJsonValue } from '@prisma/client/runtime/library';

/** system_settings key holding gateway enable/mode overrides. */
const GATEWAYS_KEY = 'admin.payment_gateways_config';

/**
 * Payment gateways admin service.
 *
 * The platform currently supports Paystack and Flutterwave — their secrets
 * live in env vars, but the ENABLED flag and MODE are operator choices that
 * must survive refetches. They persist in system_settings (FDW-safe
 * find-then-write, same pattern as reports-admin) and are merged over the
 * env-derived defaults, so toggle/mode changes are real and durable instead
 * of stub responses that silently revert on the next list.
 */
@Injectable()
export class PaymentGatewaysService {
  /** The two gateways the payment-service actually supports. */
  private static readonly PROVIDERS = ['paystack', 'flutterwave'] as const;

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /**
   * Read persisted overrides. Deliberately NO catch-and-default here: a
   * failed FDW read silently rendering as "all defaults" made disabled
   * gateways flip back to enabled on the next list — lying to the operator.
   * Corruption inside a valid row is still tolerated; real DB errors throw.
   */
  private async readOverrides(): Promise<
    Record<string, { enabled: boolean; mode: 'live' | 'test' }>
  > {
    const row = await this.prisma.systemSettings.findUnique({ where: { key: GATEWAYS_KEY } });
    const value = row?.value as unknown;
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, { enabled: boolean; mode: 'live' | 'test' }>)
      : {};
  }

  private async writeOverrides(
    overrides: Record<string, { enabled: boolean; mode: 'live' | 'test' }>
  ): Promise<void> {
    const value = overrides as unknown as InputJsonValue;
    // system_settings is a postgres_fdw FOREIGN table here — ON CONFLICT
    // (Prisma upsert) is not supported through FDW, so find-then-write,
    // matching the creator-profile pattern in user-management.
    const existing = await this.prisma.systemSettings.findUnique({ where: { key: GATEWAYS_KEY } });
    if (existing) {
      await this.prisma.systemSettings.update({ where: { key: GATEWAYS_KEY }, data: { value } });
    } else {
      await this.prisma.systemSettings.create({
        data: {
          key: GATEWAYS_KEY,
          value,
          category: 'payments',
          description: 'Payment gateway enabled/mode overrides (admin panel)',
        },
      });
    }
  }

  async getGateways() {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [overrides, totalIntents, todayIntents, successfulIntents, failedIntents, weeklyIntents] =
      await Promise.all([
        this.readOverrides(),
        this.prisma.paymentIntent.count(),
        this.prisma.paymentIntent.count({ where: { createdAt: { gte: today } } }),
        this.prisma.paymentIntent.count({ where: { status: 'completed' } }),
        this.prisma.paymentIntent.count({ where: { status: 'failed' } }),
        this.prisma.paymentIntent.count({ where: { createdAt: { gte: weekAgo } } }),
      ]);

    const successRate = totalIntents > 0 ? Math.round((successfulIntents / totalIntents) * 100) : 0;

    const items = PaymentGatewaysService.PROVIDERS.map((provider) => ({
      id: provider,
      provider,
      name: provider === 'paystack' ? 'Paystack' : 'Flutterwave',
      type: 'card',
      // Overrides persist; env could later seed defaults, but enabled-by-
      // default with mode 'live' matches the long-standing hardcode.
      enabled: overrides[provider]?.enabled ?? true,
      mode: overrides[provider]?.mode ?? ('live' as const),
      config: {},
      stats: {
        totalIntents,
        todayIntents,
        weeklyIntents,
        successRate,
        successful: successfulIntents,
        failed: failedIntents,
      },
    }));

    return { items, total: items.length };
  }

  async toggleGateway(id: string, enabled: boolean) {
    if (!PaymentGatewaysService.PROVIDERS.includes(id as 'paystack' | 'flutterwave')) {
      return null;
    }
    const overrides = await this.readOverrides();
    overrides[id] = { ...overrides[id], enabled };
    await this.writeOverrides(overrides);
    const fresh = await this.getGateways();
    const gateway = fresh.items.find((g) => g.id === id);
    return {
      gateway,
      message: `${gateway?.name ?? id} ${enabled ? 'enabled' : 'disabled'} — persisted.`,
    };
  }

  async updateGatewayMode(id: string, mode: 'live' | 'test') {
    if (!PaymentGatewaysService.PROVIDERS.includes(id as 'paystack' | 'flutterwave')) {
      return null;
    }
    const overrides = await this.readOverrides();
    overrides[id] = { ...overrides[id], mode };
    await this.writeOverrides(overrides);
    const fresh = await this.getGateways();
    const gateway = fresh.items.find((g) => g.id === id);
    return { gateway, message: `${gateway?.name ?? id} mode set to ${mode} — persisted.` };
  }

  async getWebhookEvents(provider: string, limit = 20) {
    const intents = await this.prisma.paymentIntent.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
    });

    // Map intents into WebhookEvent format, filtering loosely by metadata or provider identifier
    const items = intents
      .filter((pi) => {
        const meta = pi.metadata as Record<string, unknown> | null;
        if (!meta) return true;
        if (meta.provider) return String(meta.provider).toLowerCase() === provider.toLowerCase();
        return true;
      })
      .slice(0, limit)
      .map((pi) => {
        const meta = pi.metadata as Record<string, unknown> | null;
        return {
          id: `evt_${pi.id.slice(0, 8)}`,
          provider,
          eventType:
            pi.status === 'completed'
              ? 'charge.success'
              : pi.status === 'failed'
                ? 'charge.failed'
                : 'payment.pending',
          reference: (meta?.reference as string) || (meta?.paystackReference as string) || pi.id,
          amount: Number(pi.amount),
          currency: pi.currency,
          status:
            pi.status === 'completed' ? 'success' : pi.status === 'failed' ? 'failed' : 'pending',
          metadata: meta || undefined,
          createdAt: pi.createdAt.toISOString(),
        };
      });

    return { items, total: items.length };
  }
}
