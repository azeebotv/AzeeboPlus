#!/usr/bin/env tsx
/**
 * Master Seed Runner — Azeebo+ (Unified Single Seeder)
 *
 * Seeds all services and databases in dependency order:
 *   1. user-service (users, auth credentials, profiles, preferences)
 *   2. content-service (9 canonical universes, 8 categories, 30+ items per universe)
 *   3. search-service (search suggestions, syncs content items from content-service)
 *   4. creator-service (creator profiles, channels, earnings)
 *   5. wallet-service (wallets, initial balances, ledger)
 *   6. payment-service (payments, transactions, payment methods)
 *   7. subscription-service (bundle passes, subscription tiers)
 *   8. reward-service (levels, badges, reward point rules)
 *   9. referral-service (referral codes, referrals, reward credits)
 *  10. messaging-service (conversations, messages)
 *  11. notification-service (notification templates & user alerts)
 *  12. engagement-service (following, saved items)
 *  13. lifestyle-service (published music entries & nightlife)
 *  14. lifestyle-service guides (itineraries, neighborhoods, partners)
 *  15. lifestyle-service participation (polls, quizzes, challenges)
 *  16. universes (9 universe microservices: reality, movies, comedy, games, sports, vertical, lifestyle, creator, live-event)
 *  17. analytics-service (30-day product events & session summaries)
 *  18. admin & feature flags (universe feature flags in azeebo_content & admin console)
 *
 * Usage:
 *   pnpm tsx scripts/seed-all.ts                    # seed everything
 *   pnpm tsx scripts/seed-all.ts --service=user     # seed one service
 *   pnpm tsx scripts/seed-all.ts --dry-run          # preview without writing
 */

import { seedUserService } from './seeders/user-seeder.js';
import { seedContentService } from './seeders/content-seeder.js';
import { seedSearchService } from './seeders/search-seeder.js';
import { seedCreatorService } from './seeders/creator-seeder.js';
import { seedWalletService } from './seeders/wallet-seeder.js';
import { seedPaymentService } from './seeders/payment-seeder.js';
import { seedSubscriptionService } from './seeders/subscription-seeder.js';
import { seedRewardService } from './seeders/reward-seeder.js';
import { seedReferralService } from './seeders/referral-seeder.js';
import { seedMessagingService } from './seeders/messaging-seeder.js';
import { seedNotificationService } from './seeders/notification-seeder.js';
import { seedEngagementService } from './seeders/engagement-seeder.js';
import { seedLifestyleService } from './seeders/lifestyle-seeder.js';
import { seedLifestyleGuidesService } from './seeders/lifestyle-guides-seeder.js';
import { seedLifestyleParticipation } from './seeders/lifestyle-participation-seeder.js';
import { seedAllUniverses } from './seeders/universe-seeder.js';
import { seedAnalyticsService } from './seeders/analytics-seeder.js';
import { seedAdminFlagsService } from './seeders/admin-flags-seeder.js';

const SEED_ORDER = [
  { name: 'user', fn: seedUserService },
  { name: 'content', fn: seedContentService },
  { name: 'search', fn: seedSearchService },
  { name: 'creator', fn: seedCreatorService },
  { name: 'wallet', fn: seedWalletService },
  { name: 'payment', fn: seedPaymentService },
  { name: 'subscription', fn: seedSubscriptionService },
  { name: 'reward', fn: seedRewardService },
  { name: 'referral', fn: seedReferralService },
  { name: 'messaging', fn: seedMessagingService },
  { name: 'notification', fn: seedNotificationService },
  { name: 'engagement', fn: seedEngagementService },
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
  { name: 'analytics', fn: seedAnalyticsService },
  { name: 'admin-flags', fn: seedAdminFlagsService },
] as const;

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const serviceArg =
    process.argv.find((a) => a.startsWith('--service='))?.split('=')[1] ||
    (process.argv.includes('--service')
      ? process.argv[process.argv.indexOf('--service') + 1]
      : undefined);

  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║        Azeebo+ Master Seed Runner (Unified)        ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log(`Mode:   ${dryRun ? 'DRY RUN (no writes)' : 'LIVE EXECUTION'}`);
  console.log(`Target: ${serviceArg || 'ALL services (18 modules)'}`);
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

  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║                 Seed Summary Table                 ║');
  console.log('╠════════════════════════════════════════════════════╣');
  for (const r of results) {
    const icon = r.status === 'OK' ? '✓' : '✗';
    console.log(
      `║ ${icon} ${r.name.padEnd(24)} ${String(r.count).padStart(6)} records  ${String(r.duration).padStart(6)}ms ║`
    );
  }
  console.log('╚════════════════════════════════════════════════════╝');

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
