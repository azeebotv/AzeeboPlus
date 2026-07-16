import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class WalletRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findByUserId(userId: string) {
    return this.prisma.wallet.findUnique({ where: { userId } });
  }

  async create(data: { userId: string; currency?: string }) {
    return this.prisma.wallet.create({ data });
  }

  async update(
    id: string,
    data: Partial<{ balance: number; bonusBalance: number; promoBalance: number; currency: string }>
  ) {
    return this.prisma.wallet.update({ where: { id }, data });
  }

  async fund(userId: string, amount: number, paymentReference: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      throw new Error('Wallet not found');
    }
    return this.prisma.$transaction([
      this.prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'credit',
          amount,
          description: 'Wallet funding',
          status: 'pending',
          reference: paymentReference,
        },
      }),
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      }),
    ]);
  }

  async withdraw(userId: string, amount: number, _bankAccount: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      throw new Error('Wallet not found');
    }
    if (Number(wallet.balance) < amount) {
      throw new Error('Insufficient balance');
    }
    return this.prisma.$transaction([
      this.prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'debit',
          amount,
          description: 'Withdrawal',
          status: 'pending',
        },
      }),
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      }),
    ]);
  }

  async transfer(fromUserId: string, toUserId: string, amount: number) {
    const fromWallet = await this.prisma.wallet.findUnique({ where: { userId: fromUserId } });
    const toWallet = await this.prisma.wallet.findUnique({ where: { userId: toUserId } });
    if (!fromWallet || !toWallet) {
      throw new Error('Wallet not found');
    }
    if (Number(fromWallet.balance) < amount) {
      throw new Error('Insufficient balance');
    }
    return this.prisma.$transaction([
      this.prisma.walletTransaction.create({
        data: {
          walletId: fromWallet.id,
          type: 'debit',
          amount,
          description: `Transfer to ${toUserId}`,
          status: 'completed',
        },
      }),
      this.prisma.walletTransaction.create({
        data: {
          walletId: toWallet.id,
          type: 'credit',
          amount,
          description: `Transfer from ${fromUserId}`,
          status: 'completed',
        },
      }),
      this.prisma.wallet.update({
        where: { id: fromWallet.id },
        data: { balance: { decrement: amount } },
      }),
      this.prisma.wallet.update({
        where: { id: toWallet.id },
        data: { balance: { increment: amount } },
      }),
    ]);
  }

  async getTransactions(userId: string, page = 1, limit = 20) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      throw new Error('Wallet not found');
    }
    const [data, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where: { walletId: wallet.id },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.walletTransaction.count({ where: { walletId: wallet.id } }),
    ]);
    return {
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTransactionById(id: string) {
    return this.prisma.walletTransaction.findUnique({ where: { id } });
  }

  async getSummary(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      throw new Error('Wallet not found');
    }
    const totalTransactions = await this.prisma.walletTransaction.count({
      where: { walletId: wallet.id },
    });
    const aggregations = await this.prisma.walletTransaction.aggregate({
      where: { walletId: wallet.id, status: 'completed' },
      _sum: { amount: true },
      _count: true,
    });
    return {
      balance: wallet.balance || 0,
      totalTransactions,
      totalEarnings: aggregations._sum.amount || 0,
    };
  }

  async getAuditTrail(userId: string, page = 1, limit = 20) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      throw new Error('Wallet not found');
    }
    const [data, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where: { walletId: wallet.id },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.walletTransaction.count({ where: { walletId: wallet.id } }),
    ]);
    return {
      data,
      page,
      limit,
      total,
    };
  }

  async debit(userId: string, amount: number, description: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      throw new Error('Wallet not found');
    }
    if (Number(wallet.balance) < amount) {
      throw new Error('Insufficient balance');
    }
    return this.prisma.$transaction([
      this.prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'debit',
          amount,
          description,
          status: 'completed',
        },
      }),
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      }),
    ]);
  }

  async credit(userId: string, amount: number, description: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      throw new Error('Wallet not found');
    }
    return this.prisma.$transaction([
      this.prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'credit',
          amount,
          description,
          status: 'completed',
        },
      }),
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      }),
    ]);
  }

  async redeemReward(userId: string, points: number) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      throw new Error('Wallet not found');
    }
    const creditAmount = points / 100;
    return this.prisma.$transaction([
      this.prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'bonus',
          amount: creditAmount,
          description: `Reward redemption: ${points} points`,
          status: 'completed',
        },
      }),
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { bonusBalance: { increment: creditAmount } },
      }),
    ]);
  }

  async addBonusCredit(userId: string, amount: number, reason: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      throw new Error('Wallet not found');
    }
    return this.prisma.$transaction([
      this.prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'bonus',
          amount,
          description: `Bonus credit: ${reason}`,
          status: 'completed',
        },
      }),
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { bonusBalance: { increment: amount } },
      }),
    ]);
  }

  async addPromoCredit(userId: string, amount: number, promoCode: string, expiresAt: Date) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      throw new Error('Wallet not found');
    }
    return this.prisma.$transaction([
      this.prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'promo',
          amount,
          description: `Promo credit: ${promoCode}`,
          status: 'completed',
          metadata: {
            promoCode,
            expiresAt: expiresAt.toISOString(),
          },
        },
      }),
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { promoBalance: { increment: amount } },
      }),
    ]);
  }
}
