import {Inject,  Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async getAllWallets(options?: { page?: number; limit?: number; currency?: string }) {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const skip = (page - 1) * limit;

      const where = options?.currency ? { currency: options.currency } : {};

      const [wallets, total] = await Promise.all([
        this.prisma.wallet.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.wallet.count({ where }),
      ]);

      return {
        wallets,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to get all wallets: ${error}`);
      return {
        success: false,
        error: { code: 'GET_WALLETS_FAILED', message: 'Failed to retrieve wallets' },
      };
    }
  }

  async getWalletById(walletId: string) {
    try {
      const wallet = await this.prisma.wallet.findUnique({
        where: { id: walletId },
        include: {
          transactions: {
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      return wallet;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to get wallet by id: ${error}`);
      return {
        success: false,
        error: { code: 'GET_WALLET_FAILED', message: 'Failed to retrieve wallet' },
      };
    }
  }

  async getWalletByUserId(userId: string) {
    try {
      const wallet = await this.prisma.wallet.findUnique({
        where: { userId },
        include: {
          transactions: {
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found for user');
      }

      return wallet;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to get wallet by user id: ${error}`);
      return {
        success: false,
        error: { code: 'GET_WALLET_BY_USER_FAILED', message: 'Failed to retrieve wallet for user' },
      };
    }
  }

  async getWalletStats() {
    try {
      const [totalWallets, totalBalance, recentTransactions] = await Promise.all([
        this.prisma.wallet.count(),
        this.prisma.wallet.aggregate({
          _sum: { balance: true, bonusBalance: true, promoBalance: true },
        }),
        this.prisma.walletTransaction.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

      return {
        totalWallets,
        totalBalance: totalBalance._sum.balance || 0,
        totalBonusBalance: totalBalance._sum.bonusBalance || 0,
        totalPromoBalance: totalBalance._sum.promoBalance || 0,
        recentTransactions24h: recentTransactions,
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to get wallet stats: ${error}`);
      return {
        success: false,
        error: { code: 'GET_WALLET_STATS_FAILED', message: 'Failed to retrieve wallet stats' },
      };
    }
  }

  async getTransactionsByWalletId(
    walletId: string,
    options?: { page?: number; limit?: number; type?: string }
  ) {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = { walletId };
      if (options?.type) {
        where.type = options.type;
      }

      const [transactions, total] = await Promise.all([
        this.prisma.walletTransaction.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.walletTransaction.count({ where }),
      ]);

      return {
        transactions,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to get transactions by wallet id: ${error}`);
      return {
        success: false,
        error: { code: 'GET_TRANSACTIONS_FAILED', message: 'Failed to retrieve transactions' },
      };
    }
  }
}
