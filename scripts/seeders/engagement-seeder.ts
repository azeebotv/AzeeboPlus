/**
 * Engagement Service Seeder (referrals)
 */

import { randomDate, printCount } from './utils.js';

let PrismaClient: new (args?: unknown) => unknown;

async function getClient() {
  try {
    const mod = await import('../../services/engagement/referral-service/node_modules/@prisma/client/index.js');
    PrismaClient = mod.PrismaClient;
  } catch {
    const mod = await import('@prisma/client');
    PrismaClient = mod.PrismaClient;
  }
  return new (PrismaClient as new () => {
    $executeRaw: (query: TemplateStringsArray, ...values: unknown[]) => Promise<unknown>;
    $disconnect: () => Promise<void>;
  })();
}

export async function seedEngagementService(dryRun = false): Promise<number> {
  let count = 0;
  if (dryRun) { console.log(`  [DRY RUN] Would create 30 referrals`); return 30; }

  const prisma = await getClient();
  try {
    printCount('Referrals', 30);
    for (let i = 0; i < 30; i++) {
      const referrerId = `usr${String((i % 40) + 1).padStart(4, '0')}`;
      const referredId = `usr${String((i + 20) % 40 + 1).padStart(4, '0')}`;
      if (referrerId === referredId) continue;
      const code = `AZP${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      try {
        await prisma.$executeRaw`INSERT INTO referrals (id, "referrerId", "referredId", code, status, "rewardAmount", "createdAt") VALUES (gen_random_uuid(), ${referrerId}, ${referredId}, ${code}, 'completed', 500, ${randomDate(90)}) ON CONFLICT DO NOTHING`;
        count++;
      } catch { /* table may not exist */ }
    }
    console.log(`  Total: ${count} records`);
  } finally { await prisma.$disconnect(); }
  return count;
}
