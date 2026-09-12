/**
 * Subscription Service Seeder (bundle passes)
 *
 * Seeds the bundle_passes table so the bundles compare page
 * (GET /api/v1/subscription/bundles/compare) has real content.
 *
 * The bundle set mirrors BUNDLE_PRESETS in apps/web/src/app/bundles/page.tsx
 * (and apps/mobile/app/bundles/index.tsx) so the API matches what the UI
 * designed, and ids are stable strings so /bundles/[id] deep links work
 * deterministically across environments.
 */

import { printCount } from './utils.js';

const BUNDLES = [
  {
    id: 'entertainment',
    name: 'Entertainment Bundle',
    description: 'Reality + Comedy + Movies',
    universeIds: ['reality', 'comedy', 'movies'],
    originalPrice: 3000,
    price: 2100,
    discountPercent: 30,
    duration: 30,
    isActive: true,
    tier: 'standard',
  },
  {
    id: 'creator-pack',
    name: 'Creator Pack',
    description: 'Creator + Lifestyle',
    universeIds: ['creator', 'lifestyle'],
    originalPrice: 2000,
    price: 1500,
    discountPercent: 25,
    duration: 30,
    isActive: true,
    tier: 'premium',
  },
  {
    id: 'all-access',
    name: 'All Access',
    description: 'All 8 universes',
    universeIds: [
      'reality',
      'comedy',
      'movies',
      'creator',
      'lifestyle',
      'sports',
      'games',
      'vertical',
    ],
    originalPrice: 8000,
    price: 4800,
    discountPercent: 40,
    duration: 30,
    isActive: true,
    tier: 'ultimate',
  },
  {
    id: 'sports-games',
    name: 'Sports & Games',
    description: 'Sports + Games',
    universeIds: ['sports', 'games'],
    originalPrice: 2000,
    price: 1400,
    discountPercent: 30,
    duration: 30,
    isActive: true,
    tier: 'standard',
  },
] as const;

let PrismaClient: new (args?: unknown) => unknown;

async function getClient() {
  try {
    const mod = await import(
      '../../services/engagement/subscription-service/src/prisma/client/index.js'
    );
    PrismaClient = mod.PrismaClient;
  } catch {
    const mod = await import('@prisma/client');
    PrismaClient = mod.PrismaClient;
  }
  return new (PrismaClient as new () => {
    bundlePass: {
      upsert: (args: unknown) => Promise<{ id: string }>;
      count: (args?: unknown) => Promise<number>;
    };
    $disconnect: () => Promise<void>;
  })();
}

/** Bust the service's cached bundle list (getBundles caches for 300s). */
async function invalidateBundleCache(): Promise<void> {
  const pattern = 'subscription:bundle:passes';
  try {
    let Redis: new (url: string) => {
      scan: (cursor: string, ...args: string[]) => Promise<[string, string[]]>;
      del: (...keys: string[]) => Promise<number>;
      quit: () => Promise<void>;
    };
    try {
      ({ Redis } = await import('../../packages/shared-services/node_modules/ioredis/built/index.js'));
    } catch {
      ({ default: Redis } = await import('ioredis'));
    }
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const redis = new Redis(redisUrl);
    try {
      const keys: string[] = [];
      let cursor = '0';
      do {
        const [next, batch] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = next;
        keys.push(...batch);
      } while (cursor !== '0');
      if (keys.length > 0) await redis.del(...keys);
      console.log(`  ✓ Cache invalidated: ${pattern} (${keys.length} key${keys.length === 1 ? '' : 's'})`);
    } finally {
      await redis.quit();
    }
  } catch (error) {
    console.warn(`  ⚠ Could not invalidate cache (${(error as Error).message}). ` + 'The service will serve the fresh list once its 300s TTL expires.');
  }
}

export async function seedSubscriptionService(dryRun = false): Promise<number> {
  if (dryRun) {
    console.log(`  [DRY RUN] Would upsert ${BUNDLES.length} bundle passes`);
    return BUNDLES.length;
  }

  const prisma = await getClient();
  try {
    printCount('Bundle Passes', BUNDLES.length);
    for (const bundle of BUNDLES) {
      await prisma.bundlePass.upsert({
        where: { name: bundle.name },
        create: { ...bundle },
        update: {
          description: bundle.description,
          universeIds: [...bundle.universeIds],
          price: bundle.price,
          originalPrice: bundle.originalPrice,
          discountPercent: bundle.discountPercent,
          duration: bundle.duration,
          isActive: bundle.isActive,
          tier: bundle.tier,
        },
      });
    }
    await invalidateBundleCache();

    const total = await prisma.bundlePass.count();
    return total;
  } finally {
    await prisma.$disconnect();
  }
}
