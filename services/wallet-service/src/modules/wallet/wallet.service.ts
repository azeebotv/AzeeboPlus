import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { FundWalletDto } from './dto/fund-wallet.dto';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getBalance(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException(`Wallet not found for user ${userId}`);
    }

    return {
      success: true,
      data: {
        balance: wallet.balance,
        bonusBalance: wallet.bonusBalance,
        promoBalance: wallet.promoBalance,
        totalBalance: wallet.balance + wallet.bonusBalance + wallet.promoBalance,
        currency: wallet.currency,
      },
    };
  }

  async getTransactions(userId: string) {
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
      data: transactions,
    };
  }

  async getSummary(userId: string) {
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
        recentTransactions,
      },
    };
  }

  async initializeFunding(userId: string, fundWalletDto: FundWalletDto) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException(`Wallet not found for user ${userId}`);
    }

    if (fundWalletDto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // Create pending transaction
    const transaction = await this.prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'credit',
        amount: fundWalletDto.amount,
        status: 'pending',
        description: 'Wallet funding',
        reference: fundWalletDto.reference,
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

  async redeemReward(userId: string, points: number) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException(`Wallet not found for user ${userId}`);
    }

    if (points <= 0) {
      throw new BadRequestException('Points must be greater than 0');
    }

    // Convert points to balance (100 points = 1 NGN)
    const amount = points / 100;

    // Create transaction
    await this.prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'bonus',
        amount,
        status: 'completed',
        description: `Reward redemption: ${points} points`,
      },
    });

    // Update wallet balance
    await this.prisma.wallet.update({
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
        newBonusBalance: wallet.bonusBalance + amount,
      },
    };
  }

  async creditBalance(walletId: string, amount: number, description: string) {
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
      
      return tx.walletTransaction.create({
        data: {
          walletId,
          type: 'credit',
          amount,
          status: 'completed',
          description,
        },
      });
    });
  }

  async debitBalance(walletId: string, amount: number, description: string, reference?: string) {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.$queryRaw`
        SELECT * FROM wallets WHERE id = ${walletId} FOR UPDATE
      `;
      
      if (!wallet[0]) {
        throw new NotFoundException('Wallet not found');
      }
      
      if (wallet[0].balance < amount) {
        throw new BadRequestException('Insufficient balance');
      }
      
      await tx.wallet.update({
        where: { id: walletId },
        data: { balance: { decrement: amount } },
      });
      
      return tx.walletTransaction.create({
        data: {
          walletId,
          type: 'debit',
          amount,
          status: 'completed',
          description,
          reference,
        },
      });
    });
  }

  async addBonusCredit(walletId: string, amount: number, reason: string) {
    // Create transaction
    const transaction = await this.prisma.walletTransaction.create({
      data: {
        walletId,
        type: 'bonus',
        amount,
        status: 'completed',
        description: `Bonus credit: ${reason}`,
      },
    });

    // Update wallet balance
    await this.prisma.wallet.update({
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
        newBonusBalance: transaction.amount,
      },
    };
  }

  async addPromoCredit(walletId: string, amount: number, promoCode: string, expiresAt: Date) {
    // Create transaction
    const transaction = await this.prisma.walletTransaction.create({
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
      },
    });

    // Update wallet balance
    await this.prisma.wallet.update({
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
        newPromoBalance: amount,
      },
    };
  }

  async getTransactionAuditTrail(walletId: string, startDate: Date, endDate: Date) {
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
        transactions,
      },
    };
  }
}
