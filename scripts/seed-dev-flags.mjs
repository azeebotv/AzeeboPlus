#!/usr/bin/env node
// ============================================================================
// seed-dev-flags.mjs — enable the standard dev flag set in Redis
//
// Local development frequently needs features that are OFF by default
// (unlaunched universe features, new flows). This script writes explicit
// Redis overrides for a curated "standard dev set" so every developer and
// CI run starts from the same, known flag state — the same idea as
// start-all.sh bootstrapping the rest of the local stack.
//
// Record shape mirrors FeatureFlagService.setFlag:
//   Redis key:   feature_flags:<key>
//   Value:       JSON FeatureFlag record { key, enabled, description, owner, lastToggledBy }
//
// Usage:
//   pnpm run seed:flags                 # apply the standard dev set
//   pnpm run seed:flags -- --all        # enable EVERY registered flag
//   pnpm run seed:flags -- --reset      # delete all stored overrides (defaults win again)
//   pnpm run seed:flags -- --dry-run    # print the plan, write nothing
//
// Env:
//   REDIS_URL (default redis://localhost:6379)
//
// Notes:
//   • Keys are validated against the @azeebo/feature-flags registries — a
//     typo fails the run instead of silently writing a dead key.
//   • Infrastructure kill-switches are never enabled (see NEVER_ENABLED).
// ============================================================================

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ── Registry source ─────────────────────────────────────────────────────────
// Import the built @azeebo/feature-flags registries so keys are referenced by
// registry symbols rather than hand-copied strings.
const ffPkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'packages/feature-flags/package.json'), 'utf8'));
const ffEntry = path.join(ROOT, 'packages/feature-flags', ffPkg.main || 'dist/index.js');
const registries = (await import(`file://${ffEntry}`)).allFlagRegistries;

const KNOWN_KEYS = new Set(Object.values(registries).flatMap((r) => Object.values(r)));
function keyOf(registryName, propName) {
  const reg = registries[registryName];
  if (!reg || !(propName in reg)) {
    throw new Error(`Unknown registry entry: ${registryName}.${propName}`);
  }
  return reg[propName];
}

// ── Standard dev set ────────────────────────────────────────────────────────
// The curated set of flags worth ON for local development. Everything not
// listed here keeps its module default. Universe sentinels and the client
// bootstrap flags (web_*/mobile_*) are deliberately excluded: the gateway
// already serves them from defaults, and stored overrides would outlast any
// intended default flip.
const DEV_SET = {
  // reward-service — dev features (module defaults are already true; these
  // records make the state explicit and survive a default rollback).
  [keyOf('reward', 'streaks')]: { owner: 'reward-service' },
  [keyOf('reward', 'badges')]: { owner: 'reward-service' },
  [keyOf('reward', 'missions')]: { owner: 'reward-service' },

  // games-service — full trivia/arcade surface.
  [keyOf('games', 'tournamentsEnabled')]: { owner: 'games-service' },
  [keyOf('games', 'triviaAi')]: { owner: 'games-service' },
  [keyOf('games', 'leaderboardsSeasonal')]: { owner: 'games-service' },

  // comedy-service
  [keyOf('comedy', 'challengesEnabled')]: { owner: 'comedy-service' },

  // reality-service
  [keyOf('reality', 'liveVoting')]: { owner: 'reality-service' },

  // movie-service
  [keyOf('movie', 'cinemaPass')]: { owner: 'movie-service' },
  [keyOf('movie', 'watchlistSync')]: { owner: 'movie-service' },

  // vertical-service
  [keyOf('vertical', 'crossoversEnabled')]: { owner: 'vertical-service' },
  [keyOf('vertical', 'loreAi')]: { owner: 'vertical-service' },
  [keyOf('vertical', 'storyworldsCreate')]: { owner: 'vertical-service' },

  // sports-service
  [keyOf('sports', 'fanContests')]: { owner: 'sports-service' },
  [keyOf('sports', 'oddsFeeds')]: { owner: 'sports-service' },

  // live-event-service
  [keyOf('liveEvent', 'tickets')]: { owner: 'live-event-service' },
  [keyOf('liveEvent', 'chat')]: { owner: 'live-event-service' },

  // creator-service (universe) — monetization surface.
  [keyOf('creator', 'tipsEnabled')]: { owner: 'creator-service' },
  [keyOf('creator', 'subscriptionsEnabled')]: { owner: 'creator-service' },
  [keyOf('creator', 'monetizationInsights')]: { owner: 'creator-service' },

  // lifestyle-service — gated modules with existing pages.
  [keyOf('lifestyle', 'eventsTicketing')]: { owner: 'lifestyle-service' },
  [keyOf('lifestyle', 'cityGuide')]: { owner: 'lifestyle-service' },
  [keyOf('lifestyle', 'nightlifeBooking')]: { owner: 'lifestyle-service' },
  [keyOf('lifestyle', 'influencerVerification')]: { owner: 'lifestyle-service' },

  // user-service — social surface.
  [keyOf('user', 'followSystem')]: { owner: 'user-service' },
  [keyOf('user', 'profileV2')]: { owner: 'user-service' },
  [keyOf('user', 'privacySettingsV2')]: { owner: 'user-service' },

  // wallet / payment — broader money flows in dev.
  [keyOf('wallet', 'transfersEnabled')]: { owner: 'wallet-service' },
  [keyOf('payment', 'intentsApi')]: { owner: 'payment-service' },

  // content / search / messaging — modernized read+write paths.
  [keyOf('content', 'commentsV2')]: { owner: 'content-service' },
  [keyOf('search', 'faceted')]: { owner: 'search-service' },
  [keyOf('search', 'typoTolerance')]: { owner: 'search-service' },
  [keyOf('messaging', 'readReceipts')]: { owner: 'messaging-service' },
  [keyOf('messaging', 'typingIndicator')]: { owner: 'messaging-service' },
  [keyOf('messaging', 'mediaSharing')]: { owner: 'messaging-service' },

  // Admin + creator apps — gated studio pages (FlagGate routes).
  [keyOf('admin', 'newDashboard')]: { owner: 'admin-app' },
  [keyOf('admin', 'reportBuilder')]: { owner: 'admin-app' },
  [keyOf('creator', 'newAnalytics')]: { owner: 'creator-app' },
  [keyOf('creator', 'payoutsUi')]: { owner: 'creator-app' },
};

// Infrastructure kill-switches that must never be force-enabled by a dev seed
// (maintenance mode, rate-limit hardening, KYC, fraud, queue processors…).
const NEVER_ENABLED = new Set([
  keyOf('gateway', 'maintenanceMode'),
  keyOf('gateway', 'strictRateLimits'),
  keyOf('gateway', 'apiV2'),
  keyOf('web', 'maintenanceMode'),
  keyOf('web', 'lowDataDefault'),
  keyOf('mobile', 'lowDataDefault'),
  keyOf('mobile', 'biometricAuth'),
  keyOf('auth', 'mfaRequiredForAdmins'),
  keyOf('payment', 'kycRequired'),
  keyOf('wallet', 'fraudChecks'),
  keyOf('queue', 'processPayments'),
  keyOf('queue', 'processNotifications'),
  keyOf('queue', 'processEmails'),
  keyOf('queue', 'processAnalytics'),
  keyOf('queue', 'processContent'),
]);

// ── Redis ────────────────────────────────────────────────────────────────────
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const { default: Redis } = await import('ioredis');
const redis = new Redis(REDIS_URL, { maxRetriesPerRequest: 1 });

const PREFIX = 'feature_flags:';
const ACTOR = 'dev-seed';
const DESCRIPTION = 'Enabled for local development (seed-dev-flags)';

// ── CLI ──────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const RESET = args.includes('--reset');
const ALL = args.includes('--all');

function record(key, cfg) {
  return {
    key,
    enabled: true,
    description: DESCRIPTION,
    owner: cfg.owner || 'dev-seed',
    lastToggledBy: ACTOR,
  };
}

async function main() {
  if (RESET) {
    const keys = [];
    let cursor = '0';
    do {
      const [next, batch] = await redis.scan(cursor, 'MATCH', `${PREFIX}*`, 'COUNT', 100);
      cursor = next;
      keys.push(...batch);
    } while (cursor !== '0');
    if (keys.length === 0) {
      console.log('No stored flag overrides found — nothing to reset.');
    } else {
      await redis.del(...keys);
      console.log(`Deleted ${keys.length} stored override(s):`);
      for (const k of keys.sort()) console.log(`  - ${k.slice(PREFIX.length)}`);
      console.log('\nAll flags now evaluate from their module defaults.');
    }
    return;
  }

  // Build the plan: curated dev set, or every registered flag for --all.
  let plan;
  if (ALL) {
    plan = {};
    for (const key of KNOWN_KEYS) {
      if (NEVER_ENABLED.has(key)) continue;
      plan[key] = { owner: 'dev-seed' };
    }
  } else {
    plan = DEV_SET;
  }

  // Validate before writing: every key must be registered, and no
  // kill-switch may be enabled.
  const problems = [];
  for (const [key, cfg] of Object.entries(plan)) {
    if (!KNOWN_KEYS.has(key)) problems.push(`unregistered flag key: ${key}`);
    if (cfg.enabled !== false && NEVER_ENABLED.has(key)) {
      problems.push(`refusing to enable kill-switch: ${key}`);
    }
  }
  if (problems.length > 0) {
    console.error('Aborting — invalid plan:');
    for (const p of problems) console.error(`  ✗ ${p}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Redis: ${REDIS_URL}`);
  console.log(`Mode: ${ALL ? '--all (every registered flag)' : 'standard dev set'}`);
  console.log(`Flags to enable: ${Object.keys(plan).length}${DRY_RUN ? ' (dry run — nothing written)' : ''}\n`);

  for (const key of Object.keys(plan).sort()) {
    if (DRY_RUN) {
      console.log(`  [dry-run] ON ${key}`);
      continue;
    }
    await redis.set(`${PREFIX}${key}`, JSON.stringify(record(key, plan[key])));
    console.log(`  ✓ ON ${key}`);
  }

  if (!DRY_RUN) {
    console.log(`\nWrote ${Object.keys(plan).length} flag override(s) to Redis.`);
    console.log('Services pick these up within their 30s evaluation cache.');
  }
}

try {
  await main();
} catch (error) {
  console.error(`seed-dev-flags failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  redis.disconnect();
}
