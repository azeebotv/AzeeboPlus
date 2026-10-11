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
import { randomUUID, createHmac, timingSafeEqual } from 'crypto';
import { Prisma, WalletTransaction } from '../../prisma/client/index.js';
import { PrismaService } from '../database/prisma.service.js';
import { FundWalletDto } from './dto/fund-wallet.dto.js';
import { WithdrawWalletDto, TransferWalletDto } from './dto/withdraw-transfer.dto.js';
import { WalletResponse } from './interfaces/wallet-response.interface.js';
import { toNumber, addDecimals } from '@azeebo/utils';
import { CacheService, cacheKey, RedisService } from '@azeebo/shared-services';
import { createErrorResponse } from '@azeebo/shared-types';
import axios from 'axios';
import { EventBusService, EventTypes, EVENT_BUS_SERVICE } from '@azeebo/event-bus';
import { FeatureFlagService, walletFlags } from '@azeebo/feature-flags';

type WalletRow = {
  id: string;
  userId: string;
  balance: Prisma.Decimal;
  bonusBalance: Prisma.Decimal;
  promoBalance: Prisma.Decimal;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class WalletService {
  private readonly pointsToNairaRate: number;
  private readonly webhookSecret: string;
  private readonly logger = new Logger(WalletService.name);
  private readonly analyticsServiceBaseUrl: string;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CacheService) private readonly cacheService: CacheService,
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(EVENT_BUS_SERVICE) private readonly eventBus: EventBusService,
    @Inject(RedisService) private readonly redisService: RedisService,
    @Inject(FeatureFlagService) private readonly featureFlagService: FeatureFlagService
  ) {
    this.pointsToNairaRate = this.configService.get<number>('POINTS_TO_NAIRA_RATE', 100);
    this.webhookSecret = this.configService.getOrThrow<string>('WEBHOOK_SECRET');
    this.analyticsServiceBaseUrl = this.configService.get<string>(
      'ANALYTICS_SERVICE_URL',
      'http://analytics-service:3008'
    );
  }

  private async trackAnalyticsEvent(
    eventName: string,
    userId: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    try {
      await axios.post(
        `${this.analyticsServiceBaseUrl}/analytics/track`,
        {
          eventName,
          userId,
          metadata,
          timestamp: new Date().toISOString(),
        },
        { timeout: 10000 }
      );
    } catch (error) {
      this.logger.warn(`Failed to track analytics event: ${eventName}`);
    }
  }

  async getWalletIdByUserId(userId: string): Promise<string> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!wallet) {
      throw new NotFoundException(`Wallet not found for user ${userId}`);
    }
    return wallet.id;
  }

  private async invalidateWalletCache(userId: string): Promise<void> {
    await Promise.allSettled([
      this.cacheService.delete(cacheKey('wallet', `balance:${userId}`)),
      this.cacheService.delete(cacheKey('wallet', `summary:${userId}`)),
      this.cacheService.delete(cacheKey('wallet', `transactions:${userId}:1:20`)),
      this.cacheService.delete(cacheKey('wallet', `transactions:${userId}:1:10`)),
      this.cacheService.delete(cacheKey('wallet', `transactions:${userId}:1:50`)),
    ]);
  }

  private async invalidateWalletCacheByWalletId(walletId: string): Promise<void> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
      select: { userId: true },
    });
    if (wallet) await this.invalidateWalletCache(wallet.userId);
  }

  /**
   * Redis distributed lock around debit/credit money-movement entry points
   * (gated by the `wallet_distributed_lock` flag). The DB row lock (`FOR UPDATE`)
   * remains the primary serialization; this adds a cross-instance lock around
   * the idempotency-key pre-checks that run *outside* the DB transaction, so
   * concurrent same-key debits can't both pass the duplicate check.
   *
   * Returns a release function. When the flag is off (or Redis is unavailable)
   * the lock is skipped and the operation proceeds — fail-open, because the
   * DB transaction still guarantees balance integrity.
   */
  private async withWalletLock<T>(lockKey: string, operation: () => Promise<T>): Promise<T> {
    const distributedLockEnabled = await this.featureFlagService.isEnabled(
      walletFlags.distributedLock
    );
    if (!distributedLockEnabled) {
      return operation();
    }

    try {
      const acquired = await this.redisService.setIfNotExists(lockKey, '1', 15);
      if (!acquired) {
        throw new ConflictException('Another operation is already processing this wallet');
      }
    } catch (error: unknown) {
      if (error instanceof ConflictException) throw error;
      // Redis unavailable — fail open, the DB row lock still protects balance.
      this.logger.warn(`Distributed lock unavailable for key ${lockKey}: ${error}`);
      return operation();
    }

    try {
      return await operation();
    } finally {
      await this.redisService.del(lockKey).catch(() => undefined);
    }
  }

  /**
   * Appends an immutable entry to `wallet_ledger` when the `wallet_ledger_v2`
   * flag is on. Never throws — the ledger is an audit trail, so a ledger write
   * failure must not fail the money movement itself.
   */
  private async writeLedgerEntry(params: {
    walletId: string;
    userId: string;
    operationType: string;
    amount: number;
    balanceAfter?: number | string;
    reference?: string | null;
    idempotencyKey?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      const ledgerV2Enabled = await this.featureFlagService.isEnabled(walletFlags.ledgerV2);
      if (!ledgerV2Enabled) return;

      await this.prisma.walletLedger.create({
        data: {
          walletId: params.walletId,
          userId: params.userId,
          operationType: params.operationType,
          amount: params.amount,
          balanceAfter: params.balanceAfter ?? 0,
          reference: params.reference ?? undefined,
          idempotencyKey: params.idempotencyKey ?? undefined,
          metadata: params.metadata ? (params.metadata as Prisma.InputJsonValue) : undefined,
        },
      });
    } catch (error: unknown) {
      this.logger.warn(`Failed to write wallet ledger entry (${params.operationType}): ${error}`);
    }
  }

  /**
   * Velocity/pattern checks gated by the `wallet_fraud_checks` flag. When on,
   * money-out operations (withdraw/transfer) are rejected when the user exceeds
   * the per-hour count, per-day count, or per-day amount limits. Limits are
   * env-tunable (WALLET_FRAUD_MAX_PER_HOUR/PER_DAY/DAILY_AMOUNT) with
   * withdraw-tight, transfer-loose defaults.
   */
  private async assertFraudChecksPass(
    userId: string,
    kind: 'withdraw' | 'transfer',
    amount: number
  ): Promise<void> {
    const fraudChecksEnabled = await this.featureFlagService.isEnabled(walletFlags.fraudChecks);
    if (!fraudChecksEnabled) return;

    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) return;

    const type = kind === 'withdraw' ? 'withdraw' : 'transfer_out';
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [hourCount, dayCount, dayAgg] = await Promise.all([
      this.prisma.walletTransaction.count({
        where: { walletId: wallet.id, type, createdAt: { gte: hourAgo } },
      }),
      this.prisma.walletTransaction.count({
        where: { walletId: wallet.id, type, createdAt: { gte: dayAgo } },
      }),
      this.prisma.walletTransaction.aggregate({
        where: { walletId: wallet.id, type, status: 'completed', createdAt: { gte: dayAgo } },
        _sum: { amount: true },
      }),
    ]);

    const maxPerHour = this.configService.get<number>(
      'WALLET_FRAUD_MAX_PER_HOUR',
      kind === 'withdraw' ? 3 : 5
    );
    const maxPerDay = this.configService.get<number>(
      'WALLET_FRAUD_MAX_PER_DAY',
      kind === 'withdraw' ? 10 : 20
    );
    const maxDailyAmount = this.configService.get<number>('WALLET_FRAUD_MAX_DAILY_AMOUNT', 1000000);

    if (hourCount >= maxPerHour) {
      throw new ForbiddenException('Transaction frequency limit exceeded, please try again later');
    }
    if (dayCount >= maxPerDay) {
      throw new ForbiddenException('Daily transaction limit exceeded, please try again later');
    }
    const dailyAmount = toNumber((dayAgg._sum?.amount ?? 0).toString());
    if (dailyAmount + amount > maxDailyAmount) {
      throw new ForbiddenException('Daily transaction amount limit exceeded');
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const expectedSignature = createHmac('sha512', this.webhookSecret)
      .update(payload)
      .digest('hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const actualBuffer = Buffer.from(signature, 'hex');
    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }
    return timingSafeEqual(expectedBuffer, actualBuffer);
  }

  /**
   * Retrieves the current wallet balance for a user.
   * Returns main balance, bonus balance, promo balance, and total balance.
   * @param userId - The unique identifier of the user
   * @returns WalletResponse containing balance information
   * @throws NotFoundException if wallet does not exist for the user
   */
  async getBalance(userId: string): Promise<WalletResponse> {
    try {
      const cacheK = cacheKey('wallet', `balance:${userId}`);
      const cached = await this.cacheService.get<WalletResponse>(cacheK);
      if (cached) return cached;

      let wallet = await this.prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        // Auto-create wallet for new users
        wallet = await this.prisma.wallet.create({
          data: {
            userId,
            balance: 0,
            bonusBalance: 0,
            promoBalance: 0,
          },
        });
      }

      const result: WalletResponse = {
        success: true,
        data: {
          balance: toNumber(wallet.balance.toString()),
          bonusBalance: toNumber(wallet.bonusBalance.toString()),
          promoBalance: toNumber(wallet.promoBalance.toString()),
          totalBalance: addDecimals(
            toNumber(wallet.balance.toString()) +
              toNumber(wallet.bonusBalance.toString()) +
              toNumber(wallet.promoBalance.toString())
          ),
          currency: wallet.currency,
        },
      };

      await this.cacheService.set(cacheK, result, 60);
      return result;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to get balance for user ${userId}: ${error}`);
      throw error;
    }
  }

  /**
   * Retrieves paginated transaction history for a user's wallet.
   * Supports both page-based and cursor-based pagination.
   * @param userId - The unique identifier of the user
   * @param page - Page number for pagination (default: 1)
   * @param limit - Number of transactions per page (default: 20)
   * @param cursor - Optional cursor for cursor-based pagination
   * @returns WalletResponse with paginated transactions and metadata
   * @throws NotFoundException if wallet does not exist for the user
   */
  async getTransactions(
    userId: string,
    page: number = 1,
    limit: number = 20,
    cursor?: string
  ): Promise<WalletResponse> {
    try {
      const cacheK = cacheKey('wallet', `transactions:${userId}:${page}`);
      const cached = await this.cacheService.get<WalletResponse>(cacheK);
      if (cached) return cached;

      const wallet = await this.prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new NotFoundException(`Wallet not found for user ${userId}`);
      }

      const skip = (page - 1) * limit;

      const [transactions, total] = await this.prisma.$transaction([
        this.prisma.walletTransaction.findMany({
          where: { walletId: wallet.id },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip,
          cursor: cursor ? { id: cursor } : undefined,
        }),
        this.prisma.walletTransaction.count({
          where: { walletId: wallet.id },
        }),
      ]);

      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;
      const nextCursor = hasNextPage ? transactions[transactions.length - 1]?.id : null;
      const prevCursor = hasPrevPage ? cursor : null;

      const result: WalletResponse = {
        success: true,
        data: {
          transactions: transactions.map((t: WalletTransaction) => ({
            id: t.id,
            walletId: t.walletId,
            type: t.type,
            amount: toNumber(t.amount.toString()),
            status: t.status,
            description: t.description,
            reference: t.reference,
            metadata: t.metadata as Record<string, unknown> | null,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
          })),
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage,
            hasPrevPage,
            nextCursor,
            prevCursor,
          },
        },
      };

      await this.cacheService.set(cacheK, result, 60);
      return result;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to get transactions for user ${userId}: ${error}`);
      return {
        success: false,
        error: { code: 'GET_TRANSACTIONS_FAILED', message: 'Failed to retrieve transactions' },
      };
    }
  }

  /**
   * Retrieves a summary of the wallet including balances and recent transactions.
   * Returns the latest 5 transactions for quick overview.
   * @param userId - The unique identifier of the user
   * @returns WalletResponse with balance summary and recent transactions
   * @throws NotFoundException if wallet does not exist for the user
   */
  async getSummary(userId: string): Promise<WalletResponse> {
    try {
      const cacheK = cacheKey('wallet', `summary:${userId}`);
      const cached = await this.cacheService.get<WalletResponse>(cacheK);
      if (cached) return cached;

      const wallet = await this.prisma.wallet.findUnique({
        where: { userId },
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      });

      if (!wallet) {
        throw new NotFoundException(`Wallet not found for user ${userId}`);
      }

      const recentTransactions = wallet.transactions;

      const result: WalletResponse = {
        success: true,
        data: {
          balance: toNumber(wallet.balance.toString()),
          bonusBalance: toNumber(wallet.bonusBalance.toString()),
          promoBalance: toNumber(wallet.promoBalance.toString()),
          totalBalance: addDecimals(
            toNumber(wallet.balance.toString()) +
              toNumber(wallet.bonusBalance.toString()) +
              toNumber(wallet.promoBalance.toString())
          ),
          currency: wallet.currency,
          recentTransactions: recentTransactions.map((t: WalletTransaction) => ({
            id: t.id,
            walletId: t.walletId,
            type: t.type,
            amount: toNumber(t.amount.toString()),
            status: t.status,
            description: t.description,
            reference: t.reference,
            metadata: t.metadata as Record<string, unknown> | null,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
          })),
        },
      };

      await this.cacheService.set(cacheK, result, 60);
      return result;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to get summary for user ${userId}: ${error}`);
      return {
        success: false,
        error: { code: 'GET_SUMMARY_FAILED', message: 'Failed to retrieve wallet summary' },
      };
    }
  }

  /**
   * Initializes a wallet funding transaction.
   * Creates a pending transaction record that can be confirmed via webhook.
   * Uses idempotency key to prevent duplicate transactions.
   * @param userId - The unique identifier of the user
   * @param fundWalletDto - Funding details including amount and reference
   * @param idempotencyKey - Optional key to prevent duplicate transactions
   * @returns WalletResponse with transaction details
   * @throws NotFoundException if wallet does not exist
   * @throws BadRequestException if amount is invalid
   */
  async initializeFunding(
    userId: string,
    fundWalletDto: FundWalletDto,
    idempotencyKey?: string
  ): Promise<WalletResponse> {
    try {
      const wallet = await this.prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new NotFoundException(`Wallet not found for user ${userId}`);
      }

      if (idempotencyKey) {
        const existingTransaction = await this.prisma.walletTransaction.findUnique({
          where: { idempotencyKey },
        });
        if (existingTransaction) {
          return {
            success: true,
            data: {
              transactionId: existingTransaction.id,
              amount: toNumber(existingTransaction.amount.toString()),
              status: existingTransaction.status,
              message: 'Payment already initialized',
              balance: toNumber(wallet.balance.toString()),
              bonusBalance: toNumber(wallet.bonusBalance.toString()),
              promoBalance: toNumber(wallet.promoBalance.toString()),
            },
          };
        }
      }

      if (fundWalletDto.amount <= 0) {
        throw new BadRequestException('Amount must be greater than 0');
      }

      const transaction = await this.prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'credit',
          amount: fundWalletDto.amount,
          status: 'pending',
          description: 'Wallet funding',
          reference: fundWalletDto.reference,
          idempotencyKey,
        },
      });

      this.trackAnalyticsEvent('wallet_funding_initialized', userId, {
        transactionId: transaction.id,
        amount: fundWalletDto.amount,
        reference: fundWalletDto.reference,
      });

      return {
        success: true,
        data: {
          transactionId: transaction.id,
          amount: fundWalletDto.amount,
          status: 'pending',
          message: 'Payment initialization successful',
          balance: toNumber(wallet.balance.toString()),
          bonusBalance: toNumber(wallet.bonusBalance.toString()),
          promoBalance: toNumber(wallet.promoBalance.toString()),
        },
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      this.logger.error(`Failed to initialize funding for user ${userId}: ${error}`);
      return {
        success: false,
        error: { code: 'INIT_FUNDING_FAILED', message: 'Failed to initialize wallet funding' },
      };
    }
  }

  /**
   * Withdraws funds from wallet to bank account.
   * Validates sufficient balance before processing withdrawal.
   * Creates a debit transaction record.
   * @param userId - The unique identifier of the user
   * @param withdrawDto - Withdrawal details including amount and bank account
   * @returns WalletResponse with withdrawal details
   * @throws NotFoundException if wallet does not exist
   * @throws BadRequestException if insufficient balance
   */
  async withdraw(
    userId: string,
    withdrawDto: WithdrawWalletDto,
    idempotencyKeyHeader?: string
  ): Promise<WalletResponse> {
    try {
      await this.assertFraudChecksPass(userId, 'withdraw', withdrawDto.amount);

      const reference = `WD-${randomUUID()}`;
      const idempotencyKey =
        withdrawDto.idempotencyKey || idempotencyKeyHeader || `withdraw-${randomUUID()}`;

      const result = await this.prisma.$transaction(
        async (
          tx: Prisma.TransactionClient
        ): Promise<{ wallet: WalletRow; existingTransaction?: WalletTransaction }> => {
        // Lock the wallet row and check balance atomically
        const [wallet] = await tx.$queryRaw<WalletRow[]>`
          SELECT * FROM "wallets" WHERE "userId" = ${userId} FOR UPDATE
        `;

        if (!wallet) {
          throw new NotFoundException(`Wallet not found for user ${userId}`);
        }

        if (idempotencyKey) {
          const existingTransaction = await tx.walletTransaction.findUnique({
            where: { idempotencyKey },
          });
          if (existingTransaction) {
            return { wallet, existingTransaction };
          }
        }

        if (toNumber(wallet.balance.toString()) < withdrawDto.amount) {
          throw new BadRequestException('Insufficient balance');
        }

        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { decrement: withdrawDto.amount } },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'withdraw',
            amount: withdrawDto.amount,
            status: 'processing',
            description: withdrawDto.description || 'Withdrawal to bank account',
            reference,
            idempotencyKey,
            metadata: {
              bankAccountId: withdrawDto.bankAccountId,
            },
          },
        });

        return { wallet: (await tx.wallet.findUnique({ where: { id: wallet.id } }))! };
      }
      );

      if (result.existingTransaction) {
        const existing = result.existingTransaction;
        return {
          success: true,
          data: {
            transactionId: existing.reference,
            amount: toNumber(existing.amount.toString()),
            status: existing.status as 'processing' | 'completed' | 'failed',
            description: existing.description ?? 'Withdrawal to bank account',
            balance: toNumber(result.wallet.balance.toString()),
            bonusBalance: toNumber(result.wallet.bonusBalance.toString()),
            promoBalance: toNumber(result.wallet.promoBalance.toString()),
          },
        };
      }

      const updatedWallet = result.wallet;

      await this.invalidateWalletCache(userId);

      await this.writeLedgerEntry({
        walletId: updatedWallet.id,
        userId,
        operationType: 'withdraw',
        amount: withdrawDto.amount,
        balanceAfter: updatedWallet.balance.toString(),
        reference,
        idempotencyKey,
      });

      this.trackAnalyticsEvent('wallet_withdrawal_initiated', userId, {
        transactionId: reference,
        amount: withdrawDto.amount,
        bankAccountId: withdrawDto.bankAccountId,
      });

      return {
        success: true,
        data: {
          transactionId: reference,
          amount: withdrawDto.amount,
          status: 'processing' as const,
          description: withdrawDto.description || 'Withdrawal to bank account',
          balance: toNumber(updatedWallet.balance.toString()),
          bonusBalance: toNumber(updatedWallet.bonusBalance.toString()),
          promoBalance: toNumber(updatedWallet.promoBalance.toString()),
        },
      };
    } catch (error: unknown) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      )
        throw error;
      this.logger.error(`Failed to withdraw for user ${userId}: ${error}`);
      return {
        success: false,
        error: { code: 'WITHDRAW_FAILED', message: 'Failed to process withdrawal' },
      };
    }
  }

  /**
   * Transfers funds from one user's wallet to another user's wallet.
   * Validates sender has sufficient balance and recipient exists.
   * Creates debit transaction for sender and credit transaction for recipient.
   * @param senderId - The unique identifier of the sender
   * @param transferDto - Transfer details including amount and recipient
   * @returns WalletResponse with transfer details
   * @throws NotFoundException if sender or recipient wallet does not exist
   * @throws BadRequestException if insufficient balance or self-transfer
   */
  async transfer(
    senderId: string,
    transferDto: TransferWalletDto,
    idempotencyKeyHeader?: string
  ): Promise<WalletResponse> {
    try {
      if (senderId === transferDto.recipientId) {
        throw new BadRequestException('Cannot transfer to yourself');
      }

      await this.assertFraudChecksPass(senderId, 'transfer', transferDto.amount);

      const senderReference = `TRF-OUT-${randomUUID()}`;
      const recipientReference = `TRF-IN-${randomUUID()}`;
      const idempotencyKey =
        transferDto.idempotencyKey || idempotencyKeyHeader || `transfer-${randomUUID()}`;

      const updatedSenderWallet = await this.prisma.$transaction(
        async (
          tx: Prisma.TransactionClient
        ): Promise<{ wallet: WalletRow; existingTransaction?: WalletTransaction }> => {
          // Lock both wallets in a deterministic (id) order so concurrent
          // A→B and B→A transfers cannot deadlock on each other's locks
          const lockedWallets = await tx.$queryRaw<WalletRow[]>`
          SELECT * FROM "wallets"
          WHERE "userId" IN (${senderId}, ${transferDto.recipientId})
          ORDER BY "id" FOR UPDATE
        `;
          const senderWallet = lockedWallets.find((w) => w.userId === senderId);
          const recipientWallet = lockedWallets.find((w) => w.userId === transferDto.recipientId);

          if (!senderWallet) {
            throw new NotFoundException(`Wallet not found for user ${senderId}`);
          }

          if (idempotencyKey) {
            const existingTransaction = await tx.walletTransaction.findUnique({
              where: { idempotencyKey },
            });
            if (existingTransaction) {
              return { wallet: senderWallet, existingTransaction };
            }
          }

          if (toNumber(senderWallet.balance.toString()) < transferDto.amount) {
            throw new BadRequestException('Insufficient balance');
          }

          if (!recipientWallet) {
            throw new NotFoundException(`Wallet not found for user ${transferDto.recipientId}`);
          }

          await tx.wallet.update({
            where: { id: senderWallet.id },
            data: { balance: { decrement: transferDto.amount } },
          });

          await tx.walletTransaction.create({
            data: {
              walletId: senderWallet.id,
              type: 'transfer_out',
              amount: transferDto.amount,
              status: 'completed',
              description: transferDto.description || `Transfer to user ${transferDto.recipientId}`,
              reference: senderReference,
              idempotencyKey,
              metadata: {
                recipientId: transferDto.recipientId,
                recipientReference,
              },
            },
          });

          await tx.wallet.update({
            where: { id: recipientWallet.id },
            data: { balance: { increment: transferDto.amount } },
          });

          await tx.walletTransaction.create({
            data: {
              walletId: recipientWallet.id,
              type: 'transfer_in',
              amount: transferDto.amount,
              status: 'completed',
              description: transferDto.description || `Transfer from user ${senderId}`,
              reference: recipientReference,
              metadata: {
                senderId,
              },
            },
          });

          return { wallet: senderWallet };
        }
      );

      if (updatedSenderWallet.existingTransaction) {
        const existing = updatedSenderWallet.existingTransaction;
        return {
          success: true,
          data: {
            senderReference: existing.reference,
            recipientReference: (existing.metadata as { recipientReference?: string } | null)?.recipientReference ?? existing.reference,
            amount: toNumber(existing.amount.toString()),
            status: existing.status as 'completed',
            description: existing.description ?? `Transfer to user ${transferDto.recipientId}`,
            balance: toNumber(updatedSenderWallet.wallet.balance.toString()),
            bonusBalance: toNumber(updatedSenderWallet.wallet.bonusBalance.toString()),
            promoBalance: toNumber(updatedSenderWallet.wallet.promoBalance.toString()),
          },
        };
      }

      await this.invalidateWalletCache(senderId);
      await this.invalidateWalletCache(transferDto.recipientId);

      const recipientWalletAfter = await this.prisma.wallet.findUnique({
        where: { userId: transferDto.recipientId },
        select: { id: true, balance: true },
      });
      await this.writeLedgerEntry({
        walletId: updatedSenderWallet.wallet.id,
        userId: senderId,
        operationType: 'transfer_out',
        amount: transferDto.amount,
        balanceAfter: updatedSenderWallet.wallet.balance.toString(),
        reference: senderReference,
        idempotencyKey,
      });
      await this.writeLedgerEntry({
        walletId: recipientWalletAfter?.id ?? updatedSenderWallet.wallet.id,
        userId: transferDto.recipientId,
        operationType: 'transfer_in',
        amount: transferDto.amount,
        balanceAfter: recipientWalletAfter?.balance.toString() ?? '0',
        reference: recipientReference,
      });

      this.trackAnalyticsEvent('wallet_transfer_completed', senderId, {
        recipientId: transferDto.recipientId,
        amount: transferDto.amount,
        senderReference,
        recipientReference,
      });

      await this.eventBus.publish(
        EventTypes.WALLET_TRANSFERRED,
        {
          senderId,
          recipientId: transferDto.recipientId,
          amount: transferDto.amount,
          senderReference,
          recipientReference,
        },
        { userId: senderId }
      );

      return {
        success: true,
        data: {
          senderReference,
          recipientReference,
          amount: transferDto.amount,
          status: 'completed' as const,
          description: transferDto.description || `Transfer to user ${transferDto.recipientId}`,
          balance: toNumber(updatedSenderWallet.wallet.balance.toString()),
          bonusBalance: toNumber(updatedSenderWallet.wallet.bonusBalance.toString()),
          promoBalance: toNumber(updatedSenderWallet.wallet.promoBalance.toString()),
        },
      };
    } catch (error: unknown) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      )
        throw error;
      this.logger.error(`Failed to transfer from user ${senderId}: ${error}`);
      return {
        success: false,
        error: { code: 'TRANSFER_FAILED', message: 'Failed to process transfer' },
      };
    }
  }

  /**
   * Retrieves details of a specific wallet transaction.
   * Validates that the transaction belongs to the user's wallet.
   * @param userId - The unique identifier of the user
   * @param transactionId - The unique identifier of the transaction
   * @returns WalletResponse with transaction details
   * @throws NotFoundException if wallet or transaction does not exist
   */
  async getTransaction(userId: string, transactionId: string): Promise<WalletResponse> {
    try {
      // Single query: fetch wallet + specific transaction (fixes N+1)
      const wallet = await this.prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new NotFoundException(`Wallet not found for user ${userId}`);
      }

      const transaction = await this.prisma.walletTransaction.findFirst({
        where: {
          id: transactionId,
          walletId: wallet.id,
        },
      });

      if (!transaction) {
        throw new NotFoundException(`Transaction ${transactionId} not found`);
      }

      return {
        success: true,
        data: {
          id: transaction.id,
          walletId: transaction.walletId,
          type: transaction.type,
          amount: toNumber(transaction.amount.toString()),
          status: transaction.status,
          description: transaction.description,
          reference: transaction.reference,
          metadata: transaction.metadata as Record<string, unknown> | null,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt,
        },
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to get transaction ${transactionId} for user ${userId}: ${error}`);
      return {
        success: false,
        error: { code: 'GET_TRANSACTION_FAILED', message: 'Failed to retrieve transaction' },
      };
    }
  }

  /**
   * Redeems loyalty points for wallet bonus balance.
   * Points are converted to monetary value using the configured exchange rate.
   * Uses idempotency to prevent double redemption.
   * @param userId - The unique identifier of the user
   * @param points - Number of points to redeem
   * @param idempotencyKey - Optional key to prevent duplicate redemptions
   * @returns WalletResponse with redemption details and updated balances
   * @throws NotFoundException if wallet does not exist
   * @throws BadRequestException if points value is invalid
   */
  async redeemReward(
    userId: string,
    points: number,
    idempotencyKey?: string
  ): Promise<WalletResponse> {
    try {
      const wallet = await this.prisma.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new NotFoundException(`Wallet not found for user ${userId}`);
      }

      if (idempotencyKey) {
        const existingTransaction = await this.prisma.walletTransaction.findUnique({
          where: { idempotencyKey },
        });
        if (existingTransaction) {
          return {
            success: true,
            data: {
              message: 'Reward already redeemed',
              pointsRedeemed: points,
              amountAdded: toNumber(existingTransaction.amount.toString()),
              balance: toNumber(wallet.balance.toString()),
              bonusBalance: toNumber(wallet.bonusBalance.toString()),
              promoBalance: toNumber(wallet.promoBalance.toString()),
            },
          };
        }
      }

      if (points <= 0) {
        throw new BadRequestException('Points must be greater than 0');
      }

      const amount = points / this.pointsToNairaRate;

      const updatedWallet = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'bonus',
            amount,
            status: 'completed',
            description: `Reward redemption: ${points} points`,
            idempotencyKey,
          },
        });

        return tx.wallet.update({
          where: { userId },
          data: {
            bonusBalance: { increment: amount },
            updatedAt: new Date(),
          },
        });
      });

      return {
        success: true,
        data: {
          message: 'Reward redeemed successfully',
          pointsRedeemed: points,
          amountAdded: amount,
          balance: toNumber(updatedWallet.balance.toString()),
          bonusBalance: toNumber(updatedWallet.bonusBalance.toString()),
          promoBalance: toNumber(updatedWallet.promoBalance.toString()),
        },
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      this.logger.error(`Failed to redeem reward for user ${userId}: ${error}`);
      return {
        success: false,
        error: { code: 'REDEEM_REWARD_FAILED', message: 'Failed to redeem reward' },
      };
    }
  }

  /**
   * Credits the main wallet balance.
   * Uses database transaction to ensure atomicity of balance update and transaction logging.
   * Idempotency key prevents duplicate credits if the operation is retried.
   * @param walletId - The wallet ID to credit
   * @param amount - Amount to add to balance
   * @param description - Human-readable description of the credit
   * @param idempotencyKey - Optional key to prevent duplicate credits
   * @returns WalletResponse with credit details and updated balances
   * @throws NotFoundException if wallet does not exist
   */
  async creditBalance(
    walletId: string,
    amount: number,
    description: string,
    idempotencyKey?: string
  ): Promise<WalletResponse> {
    return this.withWalletLock(`wallet:lock:${walletId}`, async () => {
      try {
        if (idempotencyKey) {
          const existingTransaction = await this.prisma.walletTransaction.findUnique({
            where: { idempotencyKey },
          });
          if (existingTransaction) {
            const wallet = await this.prisma.wallet.findUnique({
              where: { id: walletId },
            });
            return {
              success: true,
              data: {
                walletId: existingTransaction.walletId,
                amount: toNumber(existingTransaction.amount.toString()),
                status: existingTransaction.status,
                reference: existingTransaction.reference,
                metadata: existingTransaction.metadata as Record<string, unknown> | null,
                createdAt: existingTransaction.createdAt,
                updatedAt: existingTransaction.updatedAt,
                balance: toNumber(wallet?.balance.toString() || '0'),
                bonusBalance: toNumber(wallet?.bonusBalance.toString() || '0'),
                promoBalance: toNumber(wallet?.promoBalance.toString() || '0'),
              },
            };
          }
        }

        const updatedWallet = await this.prisma.$transaction(
          async (tx: Prisma.TransactionClient) => {
            const [lockedWallet] = await tx.$queryRaw<WalletRow[]>`
          SELECT * FROM "wallets" WHERE "id" = ${walletId} FOR UPDATE
        `;

            if (!lockedWallet) {
              throw new NotFoundException('Wallet not found');
            }

            await tx.wallet.update({
              where: { id: walletId },
              data: { balance: { increment: amount } },
            });

            await tx.walletTransaction.create({
              data: {
                walletId,
                type: 'credit',
                amount,
                status: 'completed',
                description,
                idempotencyKey,
              },
            });

            return tx.wallet.findUnique({ where: { id: walletId } });
          }
        );

        await this.invalidateWalletCacheByWalletId(walletId);

        await this.writeLedgerEntry({
          walletId,
          userId: updatedWallet!.userId,
          operationType: 'credit',
          amount,
          balanceAfter: updatedWallet!.balance.toString(),
          idempotencyKey: idempotencyKey ?? null,
        });

        // Track credit event — look up userId from wallet
        const walletOwner = await this.prisma.wallet.findUnique({
          where: { id: walletId },
          select: { userId: true },
        });
        if (walletOwner) {
          this.trackAnalyticsEvent('wallet_credit_completed', walletOwner.userId, {
            walletId,
            amount,
            description,
          });

          // Downstream read-models (e.g. creator-service wallet snapshots)
          // key off this event; userId must always be present.
          await this.eventBus.publish(
            EventTypes.WALLET_FUNDED,
            { userId: walletOwner.userId, walletId, amount, description },
            { userId: walletOwner.userId }
          );
        }

        return {
          success: true,
          data: {
            walletId,
            amount,
            status: 'completed' as const,
            description,
            balance: toNumber(updatedWallet!.balance.toString()),
            bonusBalance: toNumber(updatedWallet!.bonusBalance.toString()),
            promoBalance: toNumber(updatedWallet!.promoBalance.toString()),
          },
        };
      } catch (error: unknown) {
        if (error instanceof NotFoundException) throw error;
        this.logger.error(`Failed to credit balance for wallet ${walletId}: ${error}`);
        return {
          success: false,
          error: { code: 'CREDIT_BALANCE_FAILED', message: 'Failed to credit wallet balance' },
        };
      }
    });
  }

  /**
   * Debits the main wallet balance.
   * Validates sufficient balance before debiting.
   * Uses database transaction to ensure atomicity of balance update and transaction logging.
   * Idempotency key prevents duplicate debits if the operation is retried.
   * @param walletId - The wallet ID to debit
   * @param amount - Amount to subtract from balance
   * @param description - Human-readable description of the debit
   * @param reference - Optional external reference for the transaction
   * @param idempotencyKey - Optional key to prevent duplicate debits
   * @returns WalletResponse with debit details and updated balances
   * @throws NotFoundException if wallet does not exist
   * @throws BadRequestException if insufficient balance
   */
  async debitBalance(
    walletId: string,
    amount: number,
    description: string,
    reference?: string,
    idempotencyKey?: string
  ): Promise<WalletResponse> {
    return this.withWalletLock(`wallet:lock:${walletId}`, async () => {
      try {
        const updatedWallet = await this.prisma.$transaction(
          async (tx: Prisma.TransactionClient) => {
            const [wallet] = await tx.$queryRaw<WalletRow[]>`
          SELECT * FROM "wallets" WHERE "id" = ${walletId} FOR UPDATE
        `;

            if (!wallet) {
              throw new NotFoundException('Wallet not found');
            }

            if (idempotencyKey) {
              const existingTransaction = await tx.walletTransaction.findUnique({
                where: { idempotencyKey },
              });
              if (existingTransaction) {
                return {
                  wallet,
                  existingTransaction,
                };
              }
            }

            if (toNumber(wallet.balance.toString()) < amount) {
              throw new BadRequestException('Insufficient balance');
            }

            await tx.wallet.update({
              where: { id: walletId },
              data: { balance: { decrement: amount } },
            });

            await tx.walletTransaction.create({
              data: {
                walletId,
                type: 'debit',
                amount,
                status: 'completed',
                description,
                reference,
                idempotencyKey,
              },
            });

            return { wallet: await tx.wallet.findUnique({ where: { id: walletId } }) };
          }
        );

        if (updatedWallet.existingTransaction) {
          const existingTransaction = updatedWallet.existingTransaction;
          await this.invalidateWalletCacheByWalletId(walletId);
          return {
            success: true,
            data: {
              walletId: existingTransaction.walletId,
              amount: toNumber(existingTransaction.amount.toString()),
              status: existingTransaction.status,
              reference: existingTransaction.reference,
              metadata: existingTransaction.metadata as Record<string, unknown> | null,
              createdAt: existingTransaction.createdAt,
              updatedAt: existingTransaction.updatedAt,
              balance: toNumber(updatedWallet.wallet.balance.toString()),
              bonusBalance: toNumber(updatedWallet.wallet.bonusBalance.toString()),
              promoBalance: toNumber(updatedWallet.wallet.promoBalance.toString()),
            },
          };
        }

        const wallet = updatedWallet.wallet!;

        await this.invalidateWalletCacheByWalletId(walletId);

        await this.writeLedgerEntry({
          walletId,
          userId: wallet.userId,
          operationType: 'debit',
          amount,
          balanceAfter: wallet.balance.toString(),
          reference: reference ?? null,
          idempotencyKey: idempotencyKey ?? null,
        });

        this.trackAnalyticsEvent('wallet_debit_completed', wallet.userId, {
          walletId,
          amount,
          description,
          reference,
        });

        // Downstream read-models (e.g. creator-service wallet snapshots)
        // key off this event; userId must always be present.
        await this.eventBus.publish(
          EventTypes.WALLET_DEBITED,
          { userId: wallet.userId, walletId, amount, description, reference },
          { userId: wallet.userId }
        );

        return {
          success: true,
          data: {
            walletId,
            amount,
            status: 'completed' as const,
            description,
            reference,
            balance: toNumber(wallet.balance.toString()),
            bonusBalance: toNumber(wallet.bonusBalance.toString()),
            promoBalance: toNumber(wallet.promoBalance.toString()),
          },
        };
      } catch (error: unknown) {
        if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
        this.logger.error(`Failed to debit balance for wallet ${walletId}: ${error}`);
        return {
          success: false,
          error: { code: 'DEBIT_BALANCE_FAILED', message: 'Failed to debit wallet balance' },
        };
      }
    });
  }

  /**
   * Adds bonus credit to a wallet.
   * Bonus credits are separate from main balance and have different usage rules.
   * Uses idempotency key to prevent duplicate bonuses.
   * @param walletId - The wallet ID to add bonus credit to
   * @param amount - Amount of bonus credit to add
   * @param reason - Reason for the bonus credit
   * @param idempotencyKey - Optional key to prevent duplicate bonuses
   * @returns WalletResponse with bonus credit details and updated balances
   * @throws NotFoundException if wallet does not exist
   */
  async addBonusCredit(
    walletId: string,
    amount: number,
    reason: string,
    idempotencyKey?: string
  ): Promise<WalletResponse> {
    try {
      if (idempotencyKey) {
        const existingTransaction = await this.prisma.walletTransaction.findUnique({
          where: { idempotencyKey },
        });
        if (existingTransaction) {
          const wallet = await this.prisma.wallet.findUnique({
            where: { id: walletId },
          });
          return {
            success: true,
            data: {
              transactionId: existingTransaction.id,
              amount: toNumber(existingTransaction.amount.toString()),
              reason,
              balance: toNumber(wallet?.balance.toString() || '0'),
              bonusBalance: toNumber(wallet?.bonusBalance.toString() || '0'),
              promoBalance: toNumber(wallet?.promoBalance.toString() || '0'),
            },
          };
        }
      }

      const updatedWallet = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const [lockedWallet] = await tx.$queryRaw<WalletRow[]>`
          SELECT * FROM "wallets" WHERE "id" = ${walletId} FOR UPDATE
        `;

        if (!lockedWallet) {
          throw new NotFoundException('Wallet not found');
        }

        await tx.walletTransaction.create({
          data: {
            walletId,
            type: 'bonus',
            amount,
            status: 'completed',
            description: `Bonus credit: ${reason}`,
            idempotencyKey,
          },
        });

        return tx.wallet.update({
          where: { id: walletId },
          data: {
            bonusBalance: { increment: amount },
            updatedAt: new Date(),
          },
        });
      });

      await this.invalidateWalletCacheByWalletId(walletId);

      return {
        success: true,
        data: {
          amount,
          reason,
          balance: toNumber(updatedWallet.balance.toString()),
          bonusBalance: toNumber(updatedWallet.bonusBalance.toString()),
          promoBalance: toNumber(updatedWallet.promoBalance.toString()),
        },
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to add bonus credit for wallet ${walletId}: ${error}`);
      return {
        success: false,
        error: { code: 'ADD_BONUS_FAILED', message: 'Failed to add bonus credit' },
      };
    }
  }

  /**
   * Adds promotional credit to a wallet.
   * Promo credits have an expiration date and specific usage restrictions.
   * Uses idempotency key to prevent duplicate promo applications.
   * @param walletId - The wallet ID to add promo credit to
   * @param amount - Amount of promo credit to add
   * @param promoCode - The promo code being redeemed
   * @param expiresAt - Expiration date of the promo credit
   * @param idempotencyKey - Optional key to prevent duplicate promotions
   * @returns WalletResponse with promo credit details and updated balances
   * @throws NotFoundException if wallet does not exist
   */
  async addPromoCredit(
    walletId: string,
    amount: number,
    promoCode: string,
    expiresAt: Date,
    idempotencyKey?: string
  ): Promise<WalletResponse> {
    try {
      const wallet = await this.prisma.wallet.findUnique({
        where: { id: walletId },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      if (idempotencyKey) {
        const existingTransaction = await this.prisma.walletTransaction.findUnique({
          where: { idempotencyKey },
        });
        if (existingTransaction) {
          const existingMetadata = existingTransaction.metadata as Record<string, unknown>;
          return {
            success: true,
            data: {
              transactionId: existingTransaction.id,
              amount: toNumber(existingTransaction.amount.toString()),
              promoCode: (existingMetadata?.promoCode as string) || promoCode,
              expiresAt: (existingMetadata?.expiresAt as string) || expiresAt.toISOString(),
              balance: toNumber(wallet.balance.toString()),
              bonusBalance: toNumber(wallet.bonusBalance.toString()),
              promoBalance: toNumber(wallet.promoBalance.toString()),
            },
          };
        }
      }

      const updatedWallet = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const [lockedWallet] = await tx.$queryRaw<WalletRow[]>`
          SELECT * FROM "wallets" WHERE "id" = ${walletId} FOR UPDATE
        `;

        if (!lockedWallet) {
          throw new NotFoundException('Wallet not found');
        }

        await tx.walletTransaction.create({
          data: {
            walletId,
            type: 'promo',
            amount,
            status: 'completed',
            description: `Promo credit: ${promoCode}`,
            metadata: {
              promoCode,
              expiresAt: expiresAt.toISOString(),
            },
            idempotencyKey,
          },
        });

        return tx.wallet.update({
          where: { id: walletId },
          data: {
            promoBalance: { increment: amount },
            updatedAt: new Date(),
          },
        });
      });

      await this.invalidateWalletCacheByWalletId(walletId);

      return {
        success: true,
        data: {
          amount,
          promoCode,
          expiresAt: expiresAt.toISOString(),
          balance: toNumber(updatedWallet.balance.toString()),
          bonusBalance: toNumber(updatedWallet.bonusBalance.toString()),
          promoBalance: toNumber(updatedWallet.promoBalance.toString()),
        },
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to add promo credit for wallet ${walletId}: ${error}`);
      return {
        success: false,
        error: { code: 'ADD_PROMO_FAILED', message: 'Failed to add promo credit' },
      };
    }
  }

  /**
   * Retrieves a filtered transaction audit trail for compliance and reporting.
   * Returns all transactions within the specified date range.
   * @param walletId - The wallet ID to retrieve audit trail for
   * @param startDate - Start date of the audit period
   * @param endDate - End date of the audit period
   * @returns WalletResponse with audit trail transactions and metadata
   */
  async getTransactionAuditTrail(
    walletId: string,
    startDate: Date,
    endDate: Date,
    skip = 0,
    take = 100
  ): Promise<WalletResponse> {
    try {
      const transactions = await this.prisma.walletTransaction.findMany({
        where: {
          walletId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      });

      return {
        success: true,
        data: {
          walletId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          totalTransactions: transactions.length,
          transactions: transactions.map((t: WalletTransaction) => ({
            id: t.id,
            walletId: t.walletId,
            type: t.type,
            amount: toNumber(t.amount.toString()),
            status: t.status,
            description: t.description,
            reference: t.reference,
            metadata: t.metadata as Record<string, unknown> | null,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
          })),
        },
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to get transaction audit trail for wallet ${walletId}: ${error}`);
      return createErrorResponse(
        'GET_AUDIT_TRAIL_FAILED',
        'Failed to retrieve transaction audit trail'
      );
    }
  }

  async creditWallet(params: {
    walletId: string;
    amount: number;
    description: string;
    reference: string;
  }): Promise<{ id: string; balance: string }> {
    try {
      const { walletId, amount, description, reference } = params;

      const result = await this.prisma.$transaction(async (tx) => {
        const existingTransaction = await tx.walletTransaction.findFirst({
          where: { reference },
        });

        if (existingTransaction) {
          const wallet = await tx.wallet.findUnique({ where: { id: walletId } });
          return {
            id: existingTransaction.id,
            balance: wallet?.balance.toString() || '0',
            isDuplicate: true,
          };
        }

        const [transaction, updatedWallet] = await Promise.all([
          tx.walletTransaction.create({
            data: {
              walletId,
              type: 'credit',
              amount,
              status: 'completed',
              description,
              reference,
            },
          }),
          tx.wallet.update({
            where: { id: walletId },
            data: { balance: { increment: amount } },
          }),
        ]);

        return {
          id: transaction.id,
          balance: updatedWallet.balance.toString(),
          isDuplicate: false,
        };
      });

      await this.invalidateWalletCacheByWalletId(params.walletId);

      return {
        id: result.id,
        balance: result.balance,
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to credit wallet ${params.walletId}: ${error}`);
      throw error;
    }
  }

  async debitWallet(params: {
    walletId: string;
    amount: number;
    description: string;
    idempotencyKey: string;
  }): Promise<{ id?: string; balance: string }> {
    try {
      const { walletId, amount, description, idempotencyKey } = params;

      const existingTransaction = await this.prisma.walletTransaction.findUnique({
        where: { idempotencyKey },
      });

      if (existingTransaction) {
        const wallet = await this.prisma.wallet.findUnique({ where: { id: walletId } });
        return {
          id: existingTransaction.id,
          balance: wallet?.balance.toString() || '0',
        };
      }

      const result = await this.prisma.$transaction(async (tx) => {
        const [wallet] = await tx.$queryRaw<WalletRow[]>`
          SELECT * FROM "wallets" WHERE "id" = ${walletId} FOR UPDATE
        `;
        if (!wallet || toNumber(wallet.balance.toString()) < amount) {
          throw new BadRequestException('Insufficient balance');
        }
        const transaction = await tx.walletTransaction.create({
          data: {
            walletId,
            type: 'debit',
            amount,
            status: 'completed',
            description,
            idempotencyKey,
          },
        });
        const updated = await tx.wallet.update({
          where: { id: walletId },
          data: { balance: { decrement: amount } },
        });
        return { transaction, updated };
      });

      await this.invalidateWalletCacheByWalletId(params.walletId);

      return {
        id: result.transaction.id,
        balance: result.updated.balance.toString(),
      };
    } catch (error: unknown) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Failed to debit wallet ${params.walletId}: ${error}`);
      throw error;
    }
  }

  async initiateDeposit(params: {
    userId: string;
    amount: number;
    provider: string;
  }): Promise<{ reference: string; authorizationUrl?: string }> {
    try {
      const { userId, amount, provider } = params;

      const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
      if (!wallet) {
        throw new NotFoundException(`Wallet not found for user ${userId}`);
      }

      // Call payment-service to initialize a real payment
      const paymentServiceUrl = this.configService.get<string>(
        'PAYMENT_SERVICE_URL',
        'http://payment-service:3003'
      );

      try {
        const response = await axios.post(
          `${paymentServiceUrl}/payments/initialize`,
          {
            amount,
            currency: 'NGN',
            description: `Wallet deposit via ${provider}`,
            metadata: { walletId: wallet.id, userId },
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'x-internal-api-key': this.configService.get<string>('INTERNAL_API_KEY', ''),
            },
            timeout: 15000,
          }
        );

        const result = response.data?.data;
        return {
          reference: result?.reference || `deposit_${randomUUID()}`,
          authorizationUrl: result?.checkoutUrl,
        };
      } catch (paymentError: unknown) {
        this.logger.warn(
          `Payment-service unavailable, falling back to reference-only: ${paymentError instanceof Error ? paymentError.message : String(paymentError)}`
        );
        // Fallback: create a pending transaction without authorization URL
        const reference = `${provider}_${randomUUID()}`;
        await this.prisma.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'credit',
            amount,
            status: 'pending',
            description: `Deposit via ${provider}`,
            reference,
          },
        });
        return { reference };
      }
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to initiate deposit for user ${params.userId}: ${error}`);
      throw error;
    }
  }

  /**
   * Atomic wallet charge: looks up wallet by userId, checks balance, debits,
   * and returns the transaction ID. Designed for universe services to replace
   * the duplicated get-wallet → check-balance → debit → create-entity → compensate pattern.
   * @param params - Charge parameters including userId, amount, idempotencyKey, description, metadata
   * @returns Charge result with transactionId and updated balance
   * @throws NotFoundException if wallet does not exist for the user
   * @throws BadRequestException if insufficient balance
   */
  async chargeWallet(params: {
    userId: string;
    amount: number;
    idempotencyKey: string;
    description: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ transactionId: string; balance: number }> {
    const { userId, amount, idempotencyKey, description, metadata } = params;

    return this.withWalletLock(`wallet:lock:user:${userId}`, async () => {
      // Check for duplicate via idempotency key
      const existingTransaction = await this.prisma.walletTransaction.findUnique({
        where: { idempotencyKey },
      });

      if (existingTransaction) {
        const wallet = await this.prisma.wallet.findUnique({
          where: { userId },
        });
        if (!wallet) {
          throw new NotFoundException(`Wallet not found for user ${userId}`);
        }
        return {
          transactionId: existingTransaction.id,
          balance: toNumber(wallet.balance.toString()),
        };
      }

      const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const [wallet] = await tx.$queryRaw<WalletRow[]>`
        SELECT * FROM "wallets" WHERE "userId" = ${userId} FOR UPDATE
      `;

        if (!wallet) {
          throw new NotFoundException(`Wallet not found for user ${userId}`);
        }

        if (toNumber(wallet.balance.toString()) < amount) {
          throw new BadRequestException('Insufficient balance');
        }

        const transaction = await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'debit',
            amount,
            status: 'completed',
            description,
            idempotencyKey,
            ...(metadata ? { metadata: metadata as unknown as Prisma.InputJsonValue } : {}),
          },
        });

        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { decrement: amount } },
        });

        return { transactionId: transaction.id, walletId: wallet.id };
      });

      await this.invalidateWalletCache(userId);

      await this.writeLedgerEntry({
        walletId: result.walletId,
        userId,
        operationType: 'charge',
        amount,
        balanceAfter:
          (
            await this.prisma.wallet.findUnique({
              where: { userId },
              select: { balance: true },
            })
          )?.balance.toString() ?? '0',
        idempotencyKey,
        metadata,
      });

      this.trackAnalyticsEvent('wallet_charge_completed', userId, {
        transactionId: result.transactionId,
        amount,
        description,
        idempotencyKey,
      });

      // Downstream read-models (e.g. creator-service wallet snapshots) key
      // off this event for charge-style debits (premium subscriptions, etc.).
      await this.eventBus.publish(
        EventTypes.WALLET_DEBITED,
        { userId, walletId: result.walletId, amount, description },
        { userId }
      );

      const updatedWallet = await this.prisma.wallet.findUnique({
        where: { userId },
        select: { balance: true },
      });

      return {
        transactionId: result.transactionId,
        balance: toNumber(updatedWallet?.balance.toString() || '0'),
      };
    });
  }

  /**
   * Credits back a failed operation (compensation).
   * Designed for universe services to reverse a previously debited charge
   * when entity creation fails.
   * @param params - Reversal parameters including userId, amount, idempotencyKey, description, metadata
   * @returns Credit result with transactionId and updated balance
   * @throws NotFoundException if wallet does not exist for the user
   */
  async creditReverse(params: {
    userId: string;
    amount: number;
    idempotencyKey: string;
    description: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ transactionId: string; balance: number }> {
    const { userId, amount, idempotencyKey, description, metadata } = params;

    return this.withWalletLock(`wallet:lock:user:${userId}`, async () => {
      // Check for duplicate via idempotency key
      const existingTransaction = await this.prisma.walletTransaction.findUnique({
        where: { idempotencyKey },
      });

      if (existingTransaction) {
        const wallet = await this.prisma.wallet.findUnique({
          where: { userId },
        });
        if (!wallet) {
          throw new NotFoundException(`Wallet not found for user ${userId}`);
        }
        return {
          transactionId: existingTransaction.id,
          balance: toNumber(wallet.balance.toString()),
        };
      }

      const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const [wallet] = await tx.$queryRaw<WalletRow[]>`
        SELECT * FROM "wallets" WHERE "userId" = ${userId} FOR UPDATE
      `;

        if (!wallet) {
          throw new NotFoundException(`Wallet not found for user ${userId}`);
        }

        const transaction = await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'credit',
            amount,
            status: 'completed',
            description,
            idempotencyKey,
            ...(metadata ? { metadata: metadata as unknown as Prisma.InputJsonValue } : {}),
          },
        });

        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: amount } },
        });

        return { transactionId: transaction.id, walletId: wallet.id };
      });

      await this.invalidateWalletCache(userId);

      await this.writeLedgerEntry({
        walletId: result.walletId,
        userId,
        operationType: 'reverse',
        amount,
        balanceAfter:
          (
            await this.prisma.wallet.findUnique({
              where: { userId },
              select: { balance: true },
            })
          )?.balance.toString() ?? '0',
        idempotencyKey,
        metadata,
      });

      this.trackAnalyticsEvent('wallet_credit_reverse_completed', userId, {
        transactionId: result.transactionId,
        amount,
        description,
        idempotencyKey,
      });

      const updatedWallet = await this.prisma.wallet.findUnique({
        where: { userId },
        select: { balance: true },
      });

      return {
        transactionId: result.transactionId,
        balance: toNumber(updatedWallet?.balance.toString() || '0'),
      };
    });
  }

  async processWebhook(
    webhookId: string,
    payload: {
      event: string;
      data: { id: string; amount: number; metadata?: { userId?: string; walletId?: string } };
    }
  ): Promise<{ success: boolean; transactionId?: string }> {
    try {
      const { event, data } = payload;

      if (event !== 'charge.success') {
        return { success: false };
      }

      const walletId = data.metadata?.walletId;
      const userId = data.metadata?.userId;

      if (!walletId && !userId) {
        this.logger.warn('Webhook missing wallet identification in metadata');
        throw new BadRequestException('Webhook missing wallet identification in metadata');
      }

      const transaction = await this.prisma.$transaction(async (tx) => {
        // Check for duplicate inside transaction to prevent race condition
        const existingTransaction = await tx.walletTransaction.findFirst({
          where: { reference: data.id },
        });

        if (existingTransaction) {
          return existingTransaction;
        }

        let wallets: WalletRow[];
        if (walletId) {
          wallets = await tx.$queryRaw<WalletRow[]>`
            SELECT * FROM "wallets" WHERE "id" = ${walletId} FOR UPDATE
          `;
        } else {
          wallets = await tx.$queryRaw<WalletRow[]>`
            SELECT * FROM "wallets" WHERE "userId" = ${userId!} FOR UPDATE
          `;
        }

        const wallet = wallets[0];
        if (!wallet) {
          this.logger.warn(`Wallet not found for webhook: walletId=${walletId}, userId=${userId}`);
          throw new BadRequestException('Wallet not found for webhook payment');
        }

        const txn = await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'credit',
            amount: data.amount / 100,
            status: 'completed',
            description: `Webhook payment: ${event}`,
            reference: data.id,
          },
        });

        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: data.amount / 100 } },
        });

        return txn;
      });

      const wallet = await this.prisma.wallet.findUnique({
        where: { id: transaction.walletId },
        select: { userId: true },
      });
      if (wallet) await this.invalidateWalletCache(wallet.userId);

      return { success: true, transactionId: transaction.id };
    } catch (error: unknown) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Failed to process webhook ${webhookId}: ${error}`);
      return { success: false };
    }
  }

  // ─── Alias / convenience methods ──────────────────────────────────────

  async getLinkedAccounts(_userId: string): Promise<WalletResponse> {
    // Bank accounts are stored via external payment provider; return empty until integrated.
    return { success: true, data: [] };
  }

  async linkBankAccount(
    _userId: string,
    _body: { bankName: string; accountNumber: string; accountName: string }
  ): Promise<WalletResponse> {
    throw new BadRequestException('Bank account linking not yet available');
  }

  async getWithdrawalMethods(_userId: string): Promise<WalletResponse> {
    return {
      success: true,
      data: [
        {
          id: 'bank_transfer',
          name: 'Bank Transfer',
          processingTime: '1-3 business days',
          fee: 50,
        },
        { id: 'mobile_money', name: 'Mobile Money', processingTime: 'Instant', fee: 25 },
      ],
    };
  }

  async getWithdrawalPricing(_userId: string): Promise<WalletResponse> {
    return {
      success: true,
      data: {
        minimumAmount: 1000,
        maximumAmount: 500000,
        fees: [
          { method: 'bank_transfer', percentage: 0.5, flat: 50, min: 50, max: 2000 },
          { method: 'mobile_money', percentage: 1.0, flat: 25, min: 25, max: 1000 },
        ],
      },
    };
  }

  async getWalletPricing(): Promise<WalletResponse> {
    return {
      success: true,
      data: {
        minimumDeposit: 100,
        maximumDeposit: 5000000,
        fees: [
          { method: 'card', percentage: 1.5, flat: 0 },
          { method: 'bank_transfer', percentage: 0, flat: 0 },
          { method: 'ussd', percentage: 0.5, flat: 0 },
        ],
      },
    };
  }

  async getPaymentMethods(_userId: string): Promise<WalletResponse> {
    return {
      success: true,
      data: [
        { id: 'card', name: 'Debit/Credit Card', enabled: true },
        { id: 'bank_transfer', name: 'Bank Transfer', enabled: true },
        { id: 'ussd', name: 'USSD', enabled: true },
      ],
    };
  }
}
