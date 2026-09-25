import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
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

  /**
   * Manual balance adjustment (credit/debit/correction). Writes the wallet
   * balance and an immutable adjustment transaction in one DB transaction,
   * so the ledger always explains the balance.
   */
  async adjustWalletBalance(
    walletId: string,
    amount: number,
    type: 'credit' | 'debit' | 'correction',
    description: string,
    actorId?: string
  ) {
    if (!Number.isFinite(amount) || amount === 0) {
      throw new BadRequestException('Amount must be a non-zero number');
    }
    if (type === 'debit' && amount > 0) amount = -amount;
    if (type === 'credit' && amount < 0) amount = -amount;
    if (type === 'debit') type = 'correction';

    const signed = type === 'credit' ? Math.abs(amount) : -Math.abs(amount);

    const wallet = await this.prisma.wallet.findUnique({ where: { id: walletId } });
    if (!wallet) {
      throw new NotFoundException(`Wallet ${walletId} not found`);
    }

    const newBalance = wallet.balance.plus(signed);
    if (newBalance.isNegative()) {
      throw new BadRequestException(
        `Adjustment would overdraw the wallet (balance ${wallet.balance}, delta ${signed})`
      );
    }

    const [updated, tx] = await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { id: walletId },
        data: { balance: newBalance },
      }),
      this.prisma.walletTransaction.create({
        data: {
          walletId,
          type: 'admin_adjustment',
          amount: signed,
          status: 'completed',
          description: description || `Manual ${type} by admin`,
          metadata: { actorId: actorId ?? null, adjustmentType: type },
        },
      }),
    ]);

    return {
      id: updated.id,
      userId: updated.userId,
      balance: Number(updated.balance),
      transaction: {
        id: tx.id,
        amount: Number(tx.amount),
        description: tx.description,
      },
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

  // ─── Payout Requests ────────────────────────────────────────────────────────

  async getPayoutRequests(page = 1, limit = 20, status?: string) {
    const where = status ? { status } : {};
    const [items, total, agg] = await Promise.all([
      this.prisma.payoutRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
        include: { user: { select: { displayName: true, email: true } } },
      }),
      this.prisma.payoutRequest.count({ where }),
      this.prisma.payoutRequest.groupBy({
        by: ['status'],
        _count: { id: true },
        _sum: { amount: true },
      }),
    ]);

    const statsMap: Record<string, { count: number; amount: number }> = {};
    for (const row of agg) {
      statsMap[row.status] = {
        count: row._count.id,
        amount: Number(row._sum.amount || 0),
      };
    }

    return {
      items: items.map((r) => ({
        id: r.id,
        userId: r.userId,
        amount: Number(r.amount),
        currency: r.currency,
        status: r.status,
        method: r.method,
        metadata: r.metadata as Record<string, unknown> | undefined,
        completedAt: r.completedAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        user: r.user ? { displayName: r.user.displayName, email: r.user.email } : undefined,
      })),
      total,
      stats: {
        pending: statsMap['pending']?.count ?? 0,
        pendingAmount: statsMap['pending']?.amount ?? 0,
        approved: statsMap['approved']?.count ?? 0,
        approvedAmount: statsMap['approved']?.amount ?? 0,
        completed: statsMap['completed']?.count ?? 0,
        completedAmount: statsMap['completed']?.amount ?? 0,
        rejected: statsMap['rejected']?.count ?? 0,
      },
    };
  }

  async approvePayoutRequest(id: string, actorId?: string) {
    const req = await this.prisma.payoutRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException(`Payout request ${id} not found`);
    const updated = await this.prisma.payoutRequest.update({
      where: { id },
      data: {
        status: 'approved',
        metadata: {
          ...(req.metadata as Record<string, unknown>),
          approvedBy: actorId,
          approvedAt: new Date().toISOString(),
        },
      },
    });
    return { id: updated.id, status: updated.status };
  }

  async rejectPayoutRequest(id: string, reason: string, actorId?: string) {
    const req = await this.prisma.payoutRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException(`Payout request ${id} not found`);
    const updated = await this.prisma.payoutRequest.update({
      where: { id },
      data: {
        status: 'rejected',
        metadata: {
          ...(req.metadata as Record<string, unknown>),
          rejectedBy: actorId,
          rejectedAt: new Date().toISOString(),
          rejectionReason: reason,
        },
      },
    });
    return { id: updated.id, status: updated.status };
  }
}

