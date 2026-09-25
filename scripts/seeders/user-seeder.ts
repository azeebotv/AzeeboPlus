/**
 * User Service Seeder
 * Seeds: users, profiles, preferences, watch history, saved items, following
 *
 * Requires: USER_DATABASE_URL env var (or defaults to main DATABASE_URL)
 */

import {
  generateUser, randomItem, randomDate, randomInt,
  NIGERIAN_MOVIES, UNIVERSES, printCount,
} from './utils.js';

// Dynamic Prisma client — resolved at runtime per service
let PrismaClient: new (args?: unknown) => unknown;

async function getClient() {
  // Try to load the service-specific Prisma client
  try {
    const mod = await import('../../services/core/user-service/node_modules/@prisma/client/index.js');
    PrismaClient = mod.PrismaClient;
  } catch {
    // Fallback: try generic @prisma/client
    const mod = await import('@prisma/client');
    PrismaClient = mod.PrismaClient;
  }
  return new (PrismaClient as new () => {
    user: { upsert: (args: unknown) => Promise<unknown> };
    userProfile: { upsert: (args: unknown) => Promise<unknown> };
    userPreferences: { upsert: (args: unknown) => Promise<unknown> };
    watchHistory: { upsert: (args: unknown) => Promise<unknown> };
    savedItem: { upsert: (args: unknown) => Promise<unknown> };
    following: { upsert: (args: unknown) => Promise<unknown> };
    subscription: { create: (args: unknown) => Promise<unknown> };
    $disconnect: () => Promise<void>;
  })();
}

export async function seedUserService(dryRun = false): Promise<number> {
  const USER_COUNT = 50;
  const users = Array.from({ length: USER_COUNT }, (_, i) => generateUser(i));
  let count = 0;

  if (dryRun) {
    console.log(`  [DRY RUN] Would create ${USER_COUNT} users + profiles + preferences`);
    return USER_COUNT * 3;
  }

  const prisma = await getClient();

  try {
    // ─── Users ──────────────────────────────────────────────────────────
    printCount('Users', USER_COUNT);
    for (const user of users) {
      await prisma.user.upsert({
        where: { id: user.id },
        create: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          avatar: user.avatar,
          role: user.role,
        },
        update: {},
      });
      count++;
    }

    // ─── Profiles ───────────────────────────────────────────────────────
    printCount('Profiles', USER_COUNT);
    for (const user of users) {
      await prisma.userProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          displayName: user.displayName,
          avatar: user.avatar,
          bio: user.bio,
          location: user.city,
          isPublic: Math.random() > 0.2,
        },
        update: {},
      });
      count++;
    }

    // ─── Preferences ────────────────────────────────────────────────────
    printCount('Preferences', USER_COUNT);
    for (const user of users) {
      await prisma.userPreferences.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          darkMode: Math.random() > 0.5,
          notifications: { push: true, email: true, sms: false },
          contentPreferences: [randomItem(UNIVERSES).name],
        },
        update: {},
      });
      count++;
    }

    // ─── Watch History ──────────────────────────────────────────────────
    const historyCount = 200;
    printCount('Watch History', historyCount);
    for (let i = 0; i < historyCount; i++) {
      const user = users[i % users.length];
      await prisma.watchHistory.upsert({
        where: { userId_contentId: { userId: user.id, contentId: `content-${i}` } },
        create: {
          userId: user.id,
          contentId: `content-${i}`,
          contentType: randomItem(['movie', 'music', 'comedy', 'reality']),
          universe: randomItem(UNIVERSES).name,
          watchedAt: randomDate(90),
        },
        update: {},
      });
      count++;
    }

    // ─── Saved Items ────────────────────────────────────────────────────
    const savedCount = 100;
    printCount('Saved Items', savedCount);
    for (let i = 0; i < savedCount; i++) {
      const user = users[i % users.length];
      await prisma.savedItem.upsert({
        where: { userId_contentId: { userId: user.id, contentId: `content-${i}` } },
        create: { userId: user.id, contentId: `content-${i}` },
        update: {},
      });
      count++;
    }

    // ─── Following ──────────────────────────────────────────────────────
    const followCount = 80;
    printCount('Following', followCount);
    for (let i = 0; i < followCount; i++) {
      const follower = users[i % users.length];
      const following = users[(i + 5) % users.length];
      if (follower.id !== following.id) {
        await prisma.following.upsert({
          where: { followerId_followingId: { followerId: follower.id, followingId: following.id } },
          create: { followerId: follower.id, followingId: following.id },
          update: {},
        });
        count++;
      }
    }

    // ─── Subscriptions ──────────────────────────────────────────────────
    const subCount = 30;
    printCount('Subscriptions', subCount);
    const plans = ['basic', 'standard', 'premium'];
    for (let i = 0; i < subCount; i++) {
      const user = users[i % users.length];
      await prisma.subscription.create({
        data: {
          userId: user.id,
          planType: randomItem(plans),
          status: randomItem(['active', 'active', 'active', 'expired', 'canceled']),
          startDate: randomDate(180),
          endDate: randomDate(-30),
          paymentMethod: randomItem(['card', 'wallet', 'bank_transfer']),
        },
      });
      count++;
    }

    console.log(`  Total: ${count} records`);
  } finally {
    await prisma.$disconnect();
  }

  return count;
}
