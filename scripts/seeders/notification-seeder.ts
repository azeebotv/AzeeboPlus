/**
 * Notification Service Seeder
 */

import { randomItem, randomDate, printCount } from './utils.js';

let PrismaClient: new (args?: unknown) => unknown;

async function getClient() {
  try {
    const mod = await import('../../services/engagement/notification-service/node_modules/@prisma/client/index.js');
    PrismaClient = mod.PrismaClient;
  } catch {
    const mod = await import('@prisma/client');
    PrismaClient = mod.PrismaClient;
  }
  return new (PrismaClient as new () => {
    notification: { create: (args: unknown) => Promise<unknown> };
    $disconnect: () => Promise<void>;
  })();
}

const TYPES = ['welcome', 'new_content', 'trending', 'payment_success', 'follow', 'like', 'comment', 'promo', 'system'];
const TITLES = ['Welcome!', 'New content!', 'Trending now', 'Payment OK', 'New follower', 'New like', 'New comment', '50% off!', 'System update'];

export async function seedNotificationService(dryRun = false): Promise<number> {
  let count = 0;
  if (dryRun) { console.log(`  [DRY RUN] Would create 50 notifications`); return 50; }

  const prisma = await getClient();
  try {
    printCount('User Notifications', 50);
    for (let i = 0; i < 50; i++) {
      const typeIdx = i % TYPES.length;
      await prisma.notification.create({
        data: {
          userId: `usr${String((i % 50) + 1).padStart(4, '0')}`,
          type: TYPES[typeIdx], title: TITLES[typeIdx],
          message: `This is a ${TYPES[typeIdx]} notification.`,
          metadata: { priority: randomItem(['low', 'medium', 'high']) },
          readAt: i % 3 === 0 ? randomDate(7) : null,
          createdAt: randomDate(30),
        },
      });
      count++;
    }
    console.log(`  Total: ${count} records`);
  } finally { await prisma.$disconnect(); }
  return count;
}
