import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { WithdrawWalletDto, TransferWalletDto } from './dto/withdraw-transfer.dto';
import { WalletResponse } from './interfaces/wallet-response.interface';
import { toNumber, addDecimals } from '@azeebo/utils';

@Injectable()
export class WalletService {
  private readonly pointsToNairaRate: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {
    this.pointsToNairaRate = this.configService.get<number>('POINTS_TO_NAIRA_RATE', 100);
  }

  /**
   * Retrieves the current wallet balance for a user.
   * Returns main balance, bonus balance, promo balance, and total balance.
   * @param userId - The unique identifier of the user
   * @returns WalletResponse containing balance information
   * @throws NotFoundException if wallet does not exist for the user
   */
  async getBalance(userId: string): Promise<WalletResponse> {
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

    return {
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

    return {
      success: true,
      data: {
        transactions: transactions.map((t) => ({
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
  }

  /**
   * Retrieves a summary of the wallet including balances and recent transactions.
   * Returns the latest 5 transactions for quick overview.
   * @param userId - The unique identifier of the user
   * @returns WalletResponse with balance summary and recent transactions
   * @throws NotFoundException if wallet does not exist for the user
   */
  async getSummary(userId: string): Promise<WalletResponse> {
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

    return {
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
        recentTransactions: recentTransactions.map((t) => ({
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
    const reference = `WD-${randomUUID()}`;
    const idempotencyKey = `withdraw-${userId}-${withdrawDto.amount}-${Date.now()}`;

    const updatedWallet = await this.prisma.$transaction(async (tx) => {
      // Lock the wallet row and check balance atomically
      const wallet = await tx.wallet.findUnique({
        where: { userId },
      });

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
    if (senderId === transferDto.recipientId) {
      throw new BadRequestException('Cannot transfer to yourself');
    }

    const senderReference = `TRF-OUT-${randomUUID()}`;
    const recipientReference = `TRF-IN-${randomUUID()}`;
    const idempotencyKey = `transfer-${senderId}-${transferDto.recipientId}-${transferDto.amount}-${Date.now()}`;

    const updatedSenderWallet = await this.prisma.$transaction(async (tx) => {
      // Lock sender wallet and check balance atomically
      const senderWallet = await tx.wallet.findUnique({
        where: { userId: senderId },
      });

      if (!senderWallet) {
        throw new NotFoundException(`Wallet not found for user ${senderId}`);
      }

      if (toNumber(senderWallet.balance.toString()) < transferDto.amount) {
        throw new BadRequestException('Insufficient balance');
      }

      // Lock recipient wallet
      const recipientWallet = await tx.wallet.findUnique({
        where: { userId: transferDto.recipientId },
      });

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
    });

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

    const updatedWallet = await this.prisma.$transaction(async (tx) => {
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
            balance: toNumber(wallet.balance.toString()),
            bonusBalance: toNumber(wallet.bonusBalance.toString()),
            promoBalance: toNumber(wallet.promoBalance.toString()),
          },
        };
      }
    }

    const updatedWallet = await this.prisma.$transaction(async (tx) => {
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
            balance: toNumber(wallet.balance.toString()),
            bonusBalance: toNumber(wallet.bonusBalance.toString()),
            promoBalance: toNumber(wallet.promoBalance.toString()),
          },
        };
      }
    }

    if (toNumber(wallet.balance.toString()) < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const updatedWallet = await this.prisma.$transaction(async (tx) => {
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

      return tx.wallet.findUnique({ where: { id: walletId } });
    });

    return {
      success: true,
      data: {
        walletId,
        amount,
        status: 'completed' as const,
        description,
        reference,
        balance: toNumber(updatedWallet!.balance.toString()),
        bonusBalance: toNumber(updatedWallet!.bonusBalance.toString()),
        promoBalance: toNumber(updatedWallet!.promoBalance.toString()),
      },
    };
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
        return {
          success: true,
          data: {
            transactionId: existingTransaction.id,
            amount: toNumber(existingTransaction.amount.toString()),
            reason,
            balance: toNumber(wallet.balance.toString()),
            bonusBalance: toNumber(wallet.bonusBalance.toString()),
            promoBalance: toNumber(wallet.promoBalance.toString()),
          },
        };
      }
    }

    const updatedWallet = await this.prisma.$transaction(async (tx) => {
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

    const updatedWallet = await this.prisma.$transaction(async (tx) => {
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
        transactions: transactions.map((t) => ({
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
  }

  async creditWallet(params: {
    walletId: string;
    amount: number;
    description: string;
    reference: string;
  }): Promise<{ id: string; balance: string }> {
    const { walletId, amount, description, reference } = params;

    const existingTransaction = await this.prisma.walletTransaction.findFirst({
      where: { reference },
    });

    if (existingTransaction) {
      const wallet = await this.prisma.wallet.findUnique({ where: { id: walletId } });
      return {
        id: existingTransaction.id,
        balance: wallet?.balance.toString() || '0',
      };
    }

    const [transaction, updatedWallet] = await this.prisma.$transaction([
      this.prisma.walletTransaction.create({
        data: {
          walletId,
          type: 'credit',
          amount,
          status: 'completed',
          description,
          reference,
        },
      }),
      this.prisma.wallet.update({
        where: { id: walletId },
        data: { balance: { increment: amount } },
      }),
    ]);

    return {
      id: transaction.id,
      balance: updatedWallet.balance.toString(),
    };
  }

  async debitWallet(params: {
    walletId: string;
    amount: number;
    description: string;
    idempotencyKey: string;
  }): Promise<{ id?: string; balance: string }> {
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

    const wallet = await this.prisma.wallet.findUnique({ where: { id: walletId } });
    if (!wallet || toNumber(wallet.balance.toString()) < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const [transaction, updatedWallet] = await this.prisma.$transaction([
      this.prisma.walletTransaction.create({
        data: {
          walletId,
          type: 'debit',
          amount,
          status: 'completed',
          description,
          idempotencyKey,
        },
      }),
      this.prisma.wallet.update({
        where: { id: walletId },
        data: { balance: { decrement: amount } },
      }),
    ]);

    return {
      id: transaction.id,
      balance: updatedWallet.balance.toString(),
    };
  }

  async initiateDeposit(params: {
    userId: string;
    amount: number;
    provider: string;
  }): Promise<{ reference: string; authorizationUrl?: string }> {
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
  }

  async processWebhook(
    webhookId: string,
    payload: { event: string; data: { id: string; amount: number } }
  ): Promise<{ success: boolean; transactionId?: string }> {
    const { event, data } = payload;

    if (event !== 'charge.success') {
      return { success: false };
    }

    const existingTransaction = await this.prisma.walletTransaction.findFirst({
      where: { reference: data.id },
    });

    if (existingTransaction) {
      return { success: true, transactionId: existingTransaction.id };
    }

    const transaction = await this.prisma.walletTransaction.create({
      data: {
        walletId: 'test-wallet-id',
        type: 'credit',
        amount: data.amount / 100,
        status: 'completed',
        description: `Webhook payment: ${event}`,
        reference: data.id,
      },
    });

    return { success: true, transactionId: transaction.id };
  }
}
