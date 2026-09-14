import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class WalletManagementService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getWallets(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [wallets, total] = await Promise.all([
      this.prisma.wallet.findMany({
        skip,
        take: limit,
        include: {
          user: { select: { id: true, email: true, displayName: true, avatar: true, role: true } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.wallet.count(),
    ]);

    return {
      items: wallets.map((w) => ({
        id: w.id,
        userId: w.userId,
        balance: Number(w.balance),
        bonusBalance: Number(w.bonusBalance),
        promoBalance: Number(w.promoBalance),
        currency: w.currency,
        user: w.user,
        // wallet-service has no status column yet; active is the only real state.
        status: 'active',
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
      })),
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    };
  }

  async getWalletStats() {
    const [totalWallets, totalBalance, totalBonus, totalPromo] = await Promise.all([
      this.prisma.wallet.count(),
      this.prisma.wallet.aggregate({ _sum: { balance: true } }),
      this.prisma.wallet.aggregate({ _sum: { bonusBalance: true } }),
      this.prisma.wallet.aggregate({ _sum: { promoBalance: true } }),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTransactions = await this.prisma.walletTransaction.count({
      where: { createdAt: { gte: today } },
    });

    return {
      totalWallets,
      totalBalance: Number(totalBalance._sum.balance) || 0,
      totalBonus: Number(totalBonus._sum.bonusBalance) || 0,
      totalPromo: Number(totalPromo._sum.promoBalance) || 0,
      todayTransactions,
    };
  }

  async getWalletTransactions(walletId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where: { walletId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.walletTransaction.count({ where: { walletId } }),
    ]);

    return {
      items: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        status: t.status,
        description: t.description,
        reference: t.reference,
        createdAt: t.createdAt,
      })),
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    };
  }

  async updateWalletStatus(walletId: string, status: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { id: walletId } });
    if (!wallet) {
      throw new Error(`Wallet ${walletId} not found`);
    }

    // Log the status change as a wallet transaction metadata update.
    // In production, add a `status` column to the Wallet model.
    await this.prisma.walletTransaction.create({
      data: {
        walletId,
        type: 'status_change',
        amount: 0,
        status: 'completed',
        description: `Wallet status changed to: ${status}`,
        metadata: { previousStatus: 'active', newStatus: status, changedBy: 'admin' },
      },
    });

    return {
      id: walletId,
      userId: wallet.userId,
      status,
      balance: Number(wallet.balance),
      updatedAt: new Date().toISOString(),
    };
  }
}
