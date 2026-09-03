/**
 * Wallet Service Seeder
 */

import { randomItem, randomFloat, randomDate, printCount } from './utils.js';

let PrismaClient: new (args?: unknown) => unknown;

async function getClient() {
  try {
    const mod = await import('../../services/core/wallet-service/node_modules/@prisma/client/index.js');
    PrismaClient = mod.PrismaClient;
  } catch {
    const mod = await import('@prisma/client');
    PrismaClient = mod.PrismaClient;
  }
  return new (PrismaClient as new () => {
    wallet: { upsert: (args: unknown) => Promise<{ id: string }>; findUnique: (args: unknown) => Promise<{ id: string; balance: number; bonusBalance: number; promoBalance: number } | null> };
    walletTransaction: { create: (args: unknown) => Promise<unknown> };
    balanceSnapshot: { create: (args: unknown) => Promise<unknown> };
    walletLedger: { create: (args: unknown) => Promise<unknown> };
    $disconnect: () => Promise<void>;
  })();
}

export async function seedWalletService(dryRun = false): Promise<number> {
  const USER_COUNT = 50;
  let count = 0;
  if (dryRun) { console.log(`  [DRY RUN] Would create ${USER_COUNT} wallets`); return USER_COUNT; }

  const prisma = await getClient();
  try {
    printCount('Wallets', USER_COUNT);
    const walletIds: string[] = [];
    for (let i = 0; i < USER_COUNT; i++) {
      const userId = `usr${String(i + 1).padStart(4, '0')}`;
      const wallet = await prisma.wallet.upsert({
        where: { userId },
        create: { userId, balance: randomFloat(500, 100000), bonusBalance: randomFloat(0, 5000), promoBalance: randomFloat(0, 2000) },
        update: {},
      });
      walletIds.push((wallet as { id: string }).id);
      count++;
    }

    printCount('Transactions', 200);
    for (let i = 0; i < 200; i++) {
      await prisma.walletTransaction.create({
        data: {
          walletId: walletIds[i % USER_COUNT],
          type: randomItem(['credit', 'debit', 'bonus', 'refund']),
          amount: randomFloat(100, 10000),
          status: randomItem(['completed', 'completed', 'completed', 'pending', 'failed']),
          description: randomItem(['Wallet top-up', 'Content purchase', 'Subscription', 'Tip', 'Refund']),
          reference: `ref-${Date.now()}-${i}`,
          provider: randomItem(['paystack', 'flutterwave', 'internal']),
          createdAt: randomDate(90),
        },
      });
      count++;
    }

    printCount('Balance Snapshots', 50);
    for (let i = 0; i < 50; i++) {
      const wallet = await prisma.wallet.findUnique({ where: { userId: `usr${String((i % USER_COUNT) + 1).padStart(4, '0')}` } });
      if (wallet) {
        await prisma.balanceSnapshot.create({
          data: { walletId: wallet.id, balance: wallet.balance, bonusBalance: wallet.bonusBalance, promoBalance: wallet.promoBalance, capturedAt: randomDate(30) },
        });
        count++;
      }
    }

    printCount('Ledger Entries', 100);
    for (let i = 0; i < 100; i++) {
      const userId = `usr${String((i % USER_COUNT) + 1).padStart(4, '0')}`;
      const wallet = await prisma.wallet.findUnique({ where: { userId } });
      if (wallet) {
        await prisma.walletLedger.create({
          data: { walletId: wallet.id, userId, operationType: randomItem(['credit', 'debit', 'bonus', 'refund', 'charge']), amount: randomFloat(100, 5000), balanceAfter: randomFloat(1000, 100000), reference: `ledger-${i}`, createdAt: randomDate(60) },
        });
        count++;
      }
    }

    console.log(`  Total: ${count} records`);
  } finally { await prisma.$disconnect(); }
  return count;
}
