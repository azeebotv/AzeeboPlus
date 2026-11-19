#!/usr/bin/env tsx
/**
 * Master Seed Runner — Azeebo+
 *
 * Seeds all services in dependency order:
 *   1. user-service (users, profiles, preferences)
 *   2. content-service (universes, categories, tags, content items)
 *   3. creator-service (creator profiles, channels, earnings)
 *   4. wallet-service (wallets, transactions)
 *   5. payment-service (payments, payment methods)
 *   6. messaging-service (conversations, messages)
 *   7. notification-service (notifications)
 *   8. engagement-service (following, saved items)
 *   9. subscription-service (bundle passes)
 *  10. lifestyle-service (published music entries)
 *  11. lifestyle-service guides (itineraries, neighborhoods, partners, offers)
 *
 * Usage:
 *   pnpm tsx scripts/seed-all.ts                    # seed everything
 *   pnpm tsx scripts/seed-all.ts --service user     # seed one service
 *   pnpm tsx scripts/seed-all.ts --dry-run          # preview without writing
 */

import { seedUserService } from './seeders/user-seeder.js';
import { seedContentService } from './seeders/content-seeder.js';
import { seedCreatorService } from './seeders/creator-seeder.js';
import { seedWalletService } from './seeders/wallet-seeder.js';
import { seedPaymentService } from './seeders/payment-seeder.js';
import { seedMessagingService } from './seeders/messaging-seeder.js';
import { seedNotificationService } from './seeders/notification-seeder.js';
import { seedEngagementService } from './seeders/engagement-seeder.js';
import { seedSubscriptionService } from './seeders/subscription-seeder.js';
import { seedLifestyleService } from './seeders/lifestyle-seeder.js';
import { seedLifestyleGuidesService } from './seeders/lifestyle-guides-seeder.js';
import { seedLifestyleParticipation } from './seeders/lifestyle-participation-seeder.js';
import { seedAllUniverses } from './seeders/universe-seeder.js';

const SEED_ORDER = [
  { name: 'user', fn: seedUserService },
  { name: 'content', fn: seedContentService },
  { name: 'creator', fn: seedCreatorService },
  { name: 'wallet', fn: seedWalletService },
  { name: 'payment', fn: seedPaymentService },
  { name: 'messaging', fn: seedMessagingService },
  { name: 'notification', fn: seedNotificationService },
  { name: 'engagement', fn: seedEngagementService },
  { name: 'subscription', fn: seedSubscriptionService },
  { name: 'lifestyle', fn: seedLifestyleService },
  { name: 'lifestyle-guides', fn: seedLifestyleGuidesService },
  { name: 'lifestyle-participation', fn: seedLifestyleParticipation },
  {
    name: 'universes',
    fn: async (dryRun?: boolean) => {
      if (dryRun) return 156;
      const res = await seedAllUniverses();
      return res.reduce((sum, r) => sum + r.count, 0);
    },
  },
] as const;

async function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const dryRun = process.argv.includes('--dry-run');
  const serviceArg = process.argv.find((a) => a.startsWith('--service='))?.split('=')[1]
    || (process.argv.includes('--service') ? process.argv[process.argv.indexOf('--service') + 1] : undefined);

  console.log('╔══════════════════════════════════════════╗');
  console.log('║     Azeebo+ Master Seed Runner          ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no writes)' : 'LIVE'}`);
  console.log(`Target: ${serviceArg || 'ALL services'}`);
  console.log('');

  const services = serviceArg
    ? SEED_ORDER.filter((s) => s.name === serviceArg)
    : SEED_ORDER;

  if (services.length === 0) {
    console.error(`Unknown service: ${serviceArg}`);
    console.error(`Available: ${SEED_ORDER.map((s) => s.name).join(', ')}`);
    process.exit(1);
  }

  const results: { name: string; status: string; count: number; duration: number }[] = [];

  for (const service of services) {
    const start = Date.now();
    try {
      console.log(`\n── Seeding ${service.name}-service ──`);
      const count = await service.fn(dryRun);
      const duration = Date.now() - start;
      results.push({ name: service.name, status: 'OK', count, duration });
      console.log(`  ✓ ${count} records (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - start;
      results.push({ name: service.name, status: 'FAIL', count: 0, duration });
      console.error(`  ✗ Failed: ${(error as Error).message}`);
    }
  }

  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║              Seed Summary                ║');
  console.log('╠══════════════════════════════════════════╣');
  for (const r of results) {
    const icon = r.status === 'OK' ? '✓' : '✗';
    console.log(`║ ${icon} ${r.name.padEnd(12)} ${String(r.count).padStart(5)} records  ${String(r.duration).padStart(5)}ms ║`);
  }
  console.log('╚══════════════════════════════════════════╝');

  const failed = results.filter((r) => r.status === 'FAIL');
  if (failed.length > 0) {
    console.error(`\n${failed.length} service(s) failed to seed.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Seed runner failed:', err);
  process.exit(1);
});
