import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios, { AxiosError } from 'axios';
import { PrismaService } from '../database/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import {
  DomainEvent,
  EventBusService,
  EventTypes,
  EVENT_BUS_SERVICE,
} from '@azeebo/event-bus';

/**
 * Denormalized wallet read-model sync (creator-service) — event-driven.
 *
 * wallet-service owns the canonical Wallet/WalletTransaction data; the local
 * wallet_snapshots / wallet_transaction_snapshots tables are a denormalized
 * mirror used for creator dashboards (tip history, payout views).
 *
 * Freshness comes from the event bus: wallet-service publishes
 * `wallet.funded` / `wallet.debited` on every credit/debit/charge, this
 * service subscribes and syncs the affected user's snapshot after a short
 * debounce (coalesces bursts like multi-item tip fan-out or charge retries).
 *
 * Safety net: a nightly cron sweep re-syncs every creator profile, repairing
 * anything missed while the bus was down or a consumer flag was paused.
 *
 * On-demand sync for a single user (admin endpoint) remains available for
 * support actions.
 *
 * Auth: cross-service requests ride the gateway identity headers
 * (x-user-id + x-gateway-secret) that ServiceAuthGuard validates on
 * wallet-service. INTERNAL_API_KEY is accepted as the secret when no
 * GATEWAY_SECRET is configured — the same fallback order the guard uses.
 *
 * Failure policy: a failed sync NEVER throws into the cron or the event
 * handler — it is logged and corrected by the next trigger (debounced retry
 * on the next event, nightly sweep otherwise). Snapshot data is advisory;
 * wallet-service remains the source of truth for any money movement.
 */

interface WalletBalancePayload {
  balance: number | string;
  bonusBalance?: number | string;
  promoBalance?: number | string;
  currency?: string;
}

interface WalletTransactionPayload {
  id: string;
  type: string;
  amount: number | string;
  status?: string;
  description?: string | null;
  reference?: string | null;
  createdAt: string;
}

// Real wallet-service contract (WalletController.getTransactions):
//   { success, data: { transactions: [...], pagination: { page, total,
//     totalPages, hasNextPage, ... } } }
// Flat-array envelopes with a top-level `meta` are also parsed so the sync
// survives a producer flipping between the two shapes.
interface TransactionsPage {
  transactions?: WalletTransactionPayload[];
  pagination?: {
    page?: number;
    total?: number;
    totalPages?: number;
    hasNextPage?: boolean;
  };
}

interface PaginatedEnvelope {
  success?: boolean;
  data?: TransactionsPage | WalletTransactionPayload[];
  meta?: { page?: number; total?: number; totalPages?: number };
}

interface BalanceEnvelope {
  success?: boolean;
  data?: WalletBalancePayload;
}

const TRANSACTIONS_PAGE_SIZE = 50;
const MAX_TRANSACTION_PAGES = 10; // 500 newest transactions per sync — enough for dashboards

/** Debounce window that coalesces event bursts before hitting wallet-service. */
const SYNC_DEBOUNCE_MS = 1_500;

@Injectable()
export class WalletSnapshotSyncService implements OnModuleInit {
  private readonly logger = new Logger(WalletSnapshotSyncService.name);
  private readonly walletServiceBaseUrl: string;
  private readonly gatewaySecret: string;
  private readonly eventBus?: EventBusService;
  /** userId → timer for debounced event-triggered syncs. */
  private readonly pending = new Map<string, NodeJS.Timeout>();

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Optional()
    @Inject(EVENT_BUS_SERVICE)
    eventBus?: EventBusService
  ) {
    this.walletServiceBaseUrl = this.configService.getOrThrow<string>('WALLET_SERVICE_URL');
    this.gatewaySecret =
      this.configService.get<string>('GATEWAY_SECRET') ??
      this.configService.getOrThrow<string>('INTERNAL_API_KEY');
    this.eventBus = eventBus;
  }

  /**
   * Subscribe to wallet mutation events. Requires EVENT_BUS_REDIS_URL —
   * without it the service still runs: the nightly sweep keeps snapshots
   * eventually consistent (degraded freshness, logged loudly once).
   */
  async onModuleInit(): Promise<void> {
    const bus = this.eventBus;
    if (!bus) {
      this.logger.warn(
        'Event bus not wired — wallet snapshots update only via the nightly sweep. Set EVENT_BUS_REDIS_URL to enable event-driven freshness.'
      );
      return;
    }

    for (const eventType of [EventTypes.WALLET_FUNDED, EventTypes.WALLET_DEBITED]) {
      try {
        await bus.subscribe(eventType, (event) => this.handleWalletEvent(event));
        this.logger.log(`Subscribed to ${eventType} for wallet snapshot updates`);
      } catch (error) {
        this.logger.error(
          `Failed to subscribe to ${eventType}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
  }

  /**
   * Event entry point: debounced per-user snapshot sync. Consumption is
   * paused/resumed at the bus level via the `events_consume_wallet.*` flags
   * (consumerToggle wired in AppModule); a flipped flag skips messages
   * without losing data — the nightly sweep heals the gap.
   */
  async handleWalletEvent(event: DomainEvent): Promise<void> {
    const data = event.data as { userId?: unknown };
    const userId =
      typeof data?.userId === 'string' && data.userId ? data.userId : event.metadata?.userId;

    if (typeof userId !== 'string' || !userId) {
      this.logger.warn(`${event.type} event ${event.id} carries no userId — skipping`);
      return;
    }

    this.scheduleDebouncedSync(userId);
  }

  /**
   * Nightly reconciliation sweep: every creator profile gets a current
   * snapshot, healing anything the event stream missed.
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async syncAllCreators(): Promise<void> {
    const started = Date.now();
    const creatorIds = (
      await this.prisma.creatorProfile.findMany({ select: { userId: true } })
    ).map((c) => c.userId);

    if (!creatorIds.length) {
      this.logger.log('Wallet snapshot sweep: no creator profiles found, nothing to do');
      return;
    }

    let synced = 0;
    let failed = 0;
    for (const userId of creatorIds) {
      try {
        await this.syncWalletForUser(userId);
        synced += 1;
      } catch (error) {
        failed += 1;
        this.logger.warn(
          `Wallet snapshot sync failed for creator ${userId}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    this.logger.log(
      `Wallet snapshot sweep finished: ${synced}/${creatorIds.length} synced, ${failed} failed in ${
        Date.now() - started
      }ms`
    );
  }

  /**
   * Sync one user's wallet snapshot + recent transaction snapshots.
   * Throws on wallet-service failure; callers decide retry policy.
   */
  async syncWalletForUser(userId: string): Promise<{ walletId: string; balance: string }> {
    const balance = await this.fetchBalance(userId);

    const snapshot = await this.prisma.walletSnapshot.upsert({
      where: { userId },
      create: {
        userId,
        balance: balance.balance,
        currency: balance.currency ?? 'NGN',
      },
      update: {
        balance: balance.balance,
        currency: balance.currency ?? 'NGN',
      },
    });

    await this.syncTransactions(snapshot.id, userId);

    return { walletId: snapshot.id, balance: balance.balance.toString() };
  }

  /** Debounce multiple events for the same user into one wallet-service pull. */
  private scheduleDebouncedSync(userId: string): void {
    const existing = this.pending.get(userId);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      this.pending.delete(userId);
      void this.syncWalletForUser(userId).catch((error: unknown) => {
        this.logger.warn(
          `Event-triggered wallet snapshot sync failed for ${userId}: ${
            error instanceof Error ? error.message : String(error)
          } — the nightly sweep will reconcile`
        );
      });
    }, SYNC_DEBOUNCE_MS);
    timer.unref?.();

    this.pending.set(userId, timer);
  }

  private async fetchBalance(userId: string): Promise<{ balance: number; currency?: string }> {
    const response = await this.request<BalanceEnvelope>('get', `/v1/wallet`, userId);
    const payload = response?.data;
    if (!payload || payload.balance === undefined || payload.balance === null) {
      throw new NotFoundException(`Wallet not found for user ${userId}`);
    }
    return {
      balance: Number(payload.balance),
      currency: payload.currency,
    };
  }

  private async syncTransactions(walletId: string, userId: string): Promise<void> {
    const seen = new Set<string>();
    const rows: WalletTransactionPayload[] = [];

    for (let pageNum = 1; pageNum <= MAX_TRANSACTION_PAGES; pageNum += 1) {
      const response = await this.request<PaginatedEnvelope>(
        'get',
        `/v1/wallet/transactions`,
        userId,
        { params: { page: pageNum, limit: TRANSACTIONS_PAGE_SIZE } }
      );
      const payload = response?.data;
      const txRows: WalletTransactionPayload[] = Array.isArray(payload)
        ? payload
        : (payload?.transactions ?? []);
      const pagination = Array.isArray(payload)
        ? response?.meta
        : (payload?.pagination ?? response?.meta);
      if (!txRows.length) break;
      rows.push(...txRows);
      const totalPages = pagination?.totalPages ?? pageNum;
      if (pageNum >= totalPages) break;
    }

    for (const tx of rows) {
      if (seen.has(tx.id)) continue;
      seen.add(tx.id);

      await this.prisma.walletTransactionSnapshot.upsert({
        where: { id: tx.id },
        create: {
          id: tx.id,
          walletId,
          type: tx.type,
          amount: Number(tx.amount),
          description: tx.description ?? '',
          reference: tx.reference ?? null,
          createdAt: new Date(tx.createdAt),
        },
        update: {
          walletId,
          type: tx.type,
          amount: Number(tx.amount),
          description: tx.description ?? '',
          reference: tx.reference ?? null,
        },
      });
    }
  }

  private async request<T>(
    method: 'get' | 'post',
    url: string,
    userId: string,
    config: Record<string, unknown> = {}
  ): Promise<T | undefined> {
    const headers: Record<string, string> = {
      'x-user-id': userId,
      'x-gateway-secret': this.gatewaySecret,
    };
    try {
      const response = await axios.request<T>({
        method,
        url: `${this.walletServiceBaseUrl}${url}`,
        timeout: 10_000,
        headers,
        ...config,
      });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        throw new NotFoundException(`Wallet not found for user ${userId}`);
      }
      const status =
        error instanceof AxiosError && error.response?.status
          ? ` (status ${error.response.status})`
          : '';
      throw new ServiceUnavailableException(
        `wallet-service request failed for ${url}${status}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
