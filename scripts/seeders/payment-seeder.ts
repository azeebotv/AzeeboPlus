/**
 * Payment Service Seeder
 */

import { randomItem, randomFloat, randomDate, printCount } from './utils.js';

let PrismaClient: new (args?: unknown) => unknown;

async function getClient() {
  try {
    const mod = await import('../../services/core/payment-service/node_modules/@prisma/client/index.js');
    PrismaClient = mod.PrismaClient;
  } catch {
    const mod = await import('@prisma/client');
    PrismaClient = mod.PrismaClient;
  }
  return new (PrismaClient as new () => {
    payment: { create: (args: unknown) => Promise<unknown> };
    paymentIntent: { create: (args: unknown) => Promise<unknown> };
    paymentMethod: { create: (args: unknown) => Promise<unknown> };
    $disconnect: () => Promise<void>;
  })();
}

export async function seedPaymentService(dryRun = false): Promise<number> {
  let count = 0;
  if (dryRun) { console.log(`  [DRY RUN] Would create 150 payment records`); return 150; }

  const prisma = await getClient();
  try {
    printCount('Payments', 80);
    for (let i = 0; i < 80; i++) {
      await prisma.payment.create({
        data: {
          userId: `usr${String((i % 50) + 1).padStart(4, '0')}`,
          amount: randomFloat(500, 50000), currency: 'NGN',
          status: randomItem(['completed', 'completed', 'completed', 'pending', 'failed']),
          type: randomItem(['payment', 'subscription', 'tip', 'rental']),
          provider: randomItem(['paystack', 'flutterwave']),
          providerRef: `pay_${Date.now()}_${i}`,
          createdAt: randomDate(90),
        },
      });
      count++;
    }

    printCount('Payment Intents', 40);
    for (let i = 0; i < 40; i++) {
      await prisma.paymentIntent.create({
        data: {
          userId: `usr${String((i % 50) + 1).padStart(4, '0')}`,
          amount: randomFloat(500, 20000), currency: 'NGN',
          status: randomItem(['pending', 'completed', 'failed']),
          description: randomItem(['Wallet top-up', 'Subscription', 'Content purchase']),
          idempotencyKey: `idem_${Date.now()}_${i}`,
          createdAt: randomDate(30),
        },
      });
      count++;
    }

    printCount('Payment Methods', 30);
    for (let i = 0; i < 30; i++) {
      await prisma.paymentMethod.create({
        data: {
          userId: `usr${String((i % 30) + 1).padStart(4, '0')}`,
          provider: randomItem(['paystack', 'flutterwave']),
          providerToken: `tok_${Date.now()}_${i}`,
          type: 'card', brand: randomItem(['visa', 'mastercard', 'verve']),
          last4: randomItem(['4242', '5555', '3782', '1234']),
          expiryMonth: randomItem([1, 6, 12]),
          expiryYear: randomItem([2026, 2027, 2028]),
          isDefault: i < 5,
        },
      });
      count++;
    }

    console.log(`  Total: ${count} records`);
  } finally { await prisma.$disconnect(); }
  return count;
}
