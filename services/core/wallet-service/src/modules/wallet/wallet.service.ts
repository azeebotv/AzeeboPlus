import {Inject,  Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID, createHmac, timingSafeEqual } from 'crypto';
import { Prisma, WalletTransaction } from '../../prisma/client/index.js';
import { PrismaService } from '../database/prisma.service.js';
import { FundWalletDto } from './dto/fund-wallet.dto.js';
import { WithdrawWalletDto, TransferWalletDto } from './dto/withdraw-transfer.dto.js';
import { WalletResponse } from './interfaces/wallet-response.interface.js';
import { toNumber, addDecimals } from '@azeebo/utils';
import { CacheService, cacheKey } from '@azeebo/shared-services';

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

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CacheService) private readonly cacheService: CacheService,
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {
    this.pointsToNairaRate = this.configService.get<number>('POINTS_TO_NAIRA_RATE', 100);
    this.webhookSecret = this.configService.getOrThrow<string>('WEBHOOK_SECRET');
  }

  private async invalidateWalletCache(userId: string): Promise<void> {
    await this.cacheService.delete(cacheKey('wallet', `balance:${userId}`));
    await this.cacheService.delete(cacheKey('wallet', `summary:${userId}`));
    await this.cacheService.deleteByPattern(cacheKey('wallet', `transactions:${userId}:*`));
  }

  private async invalidateWalletCacheByWalletId(walletId: string): Promise<void> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
      select: { userId: true },
    });
    if (wallet) await this.invalidateWalletCache(wallet.userId);
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
      });

      if (!wallet) {
        throw new NotFoundException(`Wallet not found for user ${userId}`);
      }

      const recentTransactions = await this.prisma.walletTransaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

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
  async withdraw(userId: string, withdrawDto: WithdrawWalletDto): Promise<WalletResponse> {
    try {
      const reference = `WD-${randomUUID()}`;
      const idempotencyKey = `withdraw-${userId}-${withdrawDto.amount}-${Date.now()}`;

      const updatedWallet = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Lock the wallet row and check balance atomically
        const [wallet] = await tx.$queryRaw<WalletRow[]>`
          SELECT * FROM "wallets" WHERE "userId" = ${userId} FOR UPDATE
        `;

        if (!wallet) {
          throw new NotFoundException(`Wallet not found for user ${userId}`);
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

        return tx.wallet.findUnique({ where: { id: wallet.id } });
      });

      await this.invalidateWalletCache(userId);

      return {
        success: true,
        data: {
          transactionId: reference,
          amount: withdrawDto.amount,
          status: 'processing' as const,
          description: withdrawDto.description || 'Withdrawal to bank account',
          balance: toNumber(updatedWallet!.balance.toString()),
          bonusBalance: toNumber(updatedWallet!.bonusBalance.toString()),
          promoBalance: toNumber(updatedWallet!.promoBalance.toString()),
        },
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
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
  async transfer(senderId: string, transferDto: TransferWalletDto): Promise<WalletResponse> {
    try {
      if (senderId === transferDto.recipientId) {
        throw new BadRequestException('Cannot transfer to yourself');
      }

      const senderReference = `TRF-OUT-${randomUUID()}`;
      const recipientReference = `TRF-IN-${randomUUID()}`;
      const idempotencyKey = `transfer-${senderId}-${transferDto.recipientId}-${transferDto.amount}-${Date.now()}`;

      const updatedSenderWallet = await this.prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          // Lock sender wallet and check balance atomically
          const [senderWallet] = await tx.$queryRaw<WalletRow[]>`
          SELECT * FROM "wallets" WHERE "userId" = ${senderId} FOR UPDATE
        `;

          if (!senderWallet) {
            throw new NotFoundException(`Wallet not found for user ${senderId}`);
          }

          if (toNumber(senderWallet.balance.toString()) < transferDto.amount) {
            throw new BadRequestException('Insufficient balance');
          }

          // Lock recipient wallet
          const [recipientWallet] = await tx.$queryRaw<WalletRow[]>`
          SELECT * FROM "wallets" WHERE "userId" = ${transferDto.recipientId} FOR UPDATE
        `;

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

          return tx.wallet.findUnique({ where: { id: senderWallet.id } });
        }
      );

      await this.invalidateWalletCache(senderId);
      await this.invalidateWalletCache(transferDto.recipientId);

      return {
        success: true,
        data: {
          senderReference,
          recipientReference,
          amount: transferDto.amount,
          status: 'completed' as const,
          description: transferDto.description || `Transfer to user ${transferDto.recipientId}`,
          balance: toNumber(updatedSenderWallet!.balance.toString()),
          bonusBalance: toNumber(updatedSenderWallet!.bonusBalance.toString()),
          promoBalance: toNumber(updatedSenderWallet!.promoBalance.toString()),
        },
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
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

      const updatedWallet = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
      });

      await this.invalidateWalletCacheByWalletId(walletId);

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
    try {
      const updatedWallet = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
      });

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
    endDate: Date
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
      return {
        success: false,
        error: {
          code: 'GET_AUDIT_TRAIL_FAILED',
          message: 'Failed to retrieve transaction audit trail',
        },
      };
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

      return {
        reference,
        authorizationUrl: `https://${provider}.com/pay/${reference}`,
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to initiate deposit for user ${params.userId}: ${error}`);
      throw error;
    }
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
}
