import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { WalletResponse } from './interfaces/wallet-response.interface';
import { Decimal } from '@prisma/client/runtime/library';

const toNumber = (val: Decimal | number): number => {
  return val instanceof Decimal ? val.toNumber() : val;
};

const addDecimals = (...vals: (Decimal | number)[]): number => {
  return vals.reduce((acc, val) => acc + toNumber(val), 0);
};

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getBalance(userId: string): Promise<WalletResponse> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException(`Wallet not found for user ${userId}`);
    }

    return {
      success: true,
      data: {
        balance: toNumber(wallet.balance),
        bonusBalance: toNumber(wallet.bonusBalance),
        promoBalance: toNumber(wallet.promoBalance),
        totalBalance: addDecimals(wallet.balance, wallet.bonusBalance, wallet.promoBalance),
        currency: wallet.currency,
      },
    };
  }

  async getTransactions(userId: string): Promise<WalletResponse> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException(`Wallet not found for user ${userId}`);
    }

    const transactions = await this.prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return {
      success: true,
      data: transactions.map((t) => ({
        id: t.id,
        walletId: t.walletId,
        type: t.type,
        amount: t.amount,
        status: t.status,
        description: t.description,
        reference: t.reference,
        metadata: t.metadata as Record<string, unknown> | null,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
    };
  }

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
        balance: wallet.balance,
        bonusBalance: wallet.bonusBalance,
        promoBalance: wallet.promoBalance,
        totalBalance: wallet.balance + wallet.bonusBalance + wallet.promoBalance,
        currency: wallet.currency,
        recentTransactions: recentTransactions.map((t) => ({
          id: t.id,
          walletId: t.walletId,
          type: t.type,
          amount: t.amount,
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

  async initializeFunding(
    userId: string,
    fundWalletDto: FundWalletDto,
    idempotencyKey?: string
  ): Promise<WalletResponse> {
    if (idempotencyKey) {
      const existingTransaction = await this.prisma.walletTransaction.findUnique({
        where: { idempotencyKey },
      });
      if (existingTransaction) {
        return {
          success: true,
          data: {
            transactionId: existingTransaction.id,
            amount: existingTransaction.amount,
            status: existingTransaction.status,
            message: 'Payment already initialized',
          },
        };
      }
    }

    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException(`Wallet not found for user ${userId}`);
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
      },
    };
  }

  async redeemReward(
    userId: string,
    points: number,
    idempotencyKey?: string
  ): Promise<WalletResponse> {
    if (idempotencyKey) {
      const existingTransaction = await this.prisma.walletTransaction.findUnique({
        where: { idempotencyKey },
      });
      if (existingTransaction) {
        const wallet = await this.prisma.wallet.findUnique({
          where: { userId },
        });
        return {
          success: true,
          data: {
            message: 'Reward already redeemed',
            pointsRedeemed: points,
            amountAdded: toNumber(existingTransaction.amount),
            newBonusBalance: wallet ? toNumber(wallet.bonusBalance) : 0,
          },
        };
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new NotFoundException(`Wallet not found for user ${userId}`);
      }

      if (points <= 0) {
        throw new BadRequestException('Points must be greater than 0');
      }

      const amount = points / 100;

      const _transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'bonus',
          amount,
          status: 'completed',
          description: `Reward redemption: ${points} points`,
          idempotencyKey,
        },
      });

      const updatedWallet = await tx.wallet.update({
        where: { userId },
        data: {
          bonusBalance: { increment: amount },
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        data: {
          message: 'Reward redeemed successfully',
          pointsRedeemed: points,
          amountAdded: amount,
          newBonusBalance: toNumber(updatedWallet.bonusBalance),
        },
      };
    }) as Promise<WalletResponse>;
  }

  async creditBalance(
    walletId: string,
    amount: number,
    description: string,
    idempotencyKey?: string
  ): Promise<WalletResponse> {
    if (idempotencyKey) {
      const existingTransaction = await this.prisma.walletTransaction.findUnique({
        where: { idempotencyKey },
      });
      if (existingTransaction) {
        return {
          success: true,
          data: {
            id: existingTransaction.id,
            walletId: existingTransaction.walletId,
            type: existingTransaction.type,
            amount: existingTransaction.amount,
            status: existingTransaction.status,
            description: existingTransaction.description,
            reference: existingTransaction.reference,
            metadata: existingTransaction.metadata as Record<string, unknown> | null,
            createdAt: existingTransaction.createdAt,
            updatedAt: existingTransaction.updatedAt,
          },
        };
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { id: walletId },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      await tx.wallet.update({
        where: { id: walletId },
        data: { balance: { increment: amount } },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId,
          type: 'credit',
          amount,
          status: 'completed',
          description,
          idempotencyKey,
        },
      });

      return {
        success: true,
        data: {
          id: transaction.id,
          walletId: transaction.walletId,
          type: transaction.type,
          amount: transaction.amount,
          status: transaction.status,
          description: transaction.description,
          reference: transaction.reference,
          metadata: transaction.metadata as Record<string, unknown> | null,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt,
        },
      };
    }) as Promise<WalletResponse>;
  }

  async debitBalance(
    walletId: string,
    amount: number,
    description: string,
    reference?: string,
    idempotencyKey?: string
  ): Promise<WalletResponse> {
    if (idempotencyKey) {
      const existingTransaction = await this.prisma.walletTransaction.findUnique({
        where: { idempotencyKey },
      });
      if (existingTransaction) {
        return {
          success: true,
          data: {
            id: existingTransaction.id,
            walletId: existingTransaction.walletId,
            type: existingTransaction.type,
            amount: existingTransaction.amount,
            status: existingTransaction.status,
            description: existingTransaction.description,
            reference: existingTransaction.reference,
            metadata: existingTransaction.metadata as Record<string, unknown> | null,
            createdAt: existingTransaction.createdAt,
            updatedAt: existingTransaction.updatedAt,
          },
        };
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const walletResult = await tx.$queryRaw<Array<{ id: string; balance: number }>>`
        SELECT id, balance FROM wallets WHERE id = ${walletId} FOR UPDATE
      `;

      if (!walletResult || walletResult.length === 0) {
        throw new NotFoundException('Wallet not found');
      }

      if (walletResult[0].balance < amount) {
        throw new BadRequestException('Insufficient balance');
      }

      await tx.wallet.update({
        where: { id: walletId },
        data: { balance: { decrement: amount } },
      });

      const transaction = await tx.walletTransaction.create({
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

      return {
        success: true,
        data: {
          id: transaction.id,
          walletId: transaction.walletId,
          type: transaction.type,
          amount: transaction.amount,
          status: transaction.status,
          description: transaction.description,
          reference: transaction.reference,
          metadata: transaction.metadata as Record<string, unknown> | null,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt,
        },
      };
    }) as Promise<WalletResponse>;
  }

  async addBonusCredit(
    walletId: string,
    amount: number,
    reason: string,
    idempotencyKey?: string
  ): Promise<WalletResponse> {
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
            amount: toNumber(existingTransaction.amount),
            reason,
            newBonusBalance: wallet ? toNumber(wallet.bonusBalance) : 0,
          },
        };
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId,
          type: 'bonus',
          amount,
          status: 'completed',
          description: `Bonus credit: ${reason}`,
          idempotencyKey,
        },
      });

      const updatedWallet = await tx.wallet.update({
        where: { id: walletId },
        data: {
          bonusBalance: { increment: amount },
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        data: {
          transactionId: transaction.id,
          amount,
          reason,
          newBonusBalance: toNumber(updatedWallet.bonusBalance),
        },
      };
    }) as Promise<WalletResponse>;
  }

  async addPromoCredit(
    walletId: string,
    amount: number,
    promoCode: string,
    expiresAt: Date,
    idempotencyKey?: string
  ): Promise<WalletResponse> {
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
            amount: toNumber(existingTransaction.amount),
            promoCode,
            expiresAt: expiresAt.toISOString(),
            newPromoBalance: wallet ? toNumber(wallet.promoBalance) : 0,
          },
        };
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.walletTransaction.create({
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

      const updatedWallet = await tx.wallet.update({
        where: { id: walletId },
        data: {
          promoBalance: { increment: amount },
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        data: {
          transactionId: transaction.id,
          amount,
          promoCode,
          expiresAt: expiresAt.toISOString(),
          newPromoBalance: toNumber(updatedWallet.promoBalance),
        },
      };
    }) as Promise<WalletResponse>;
  }

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
          amount: t.amount,
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
}
