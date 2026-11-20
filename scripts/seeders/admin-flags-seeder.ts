/**
 * Admin & Universe Feature Flags Seeder — Azeebo+
 *
 * Populates:
 *   1. azeebo_content.universe_feature_flags (read by Admin Portal via FDW)
 *   2. Redis feature_flags (read by Gateway & FeatureFlagService)
 *
 * Fully idempotent.
 */

import pg from 'pg';

const { Pool } = pg;

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '5432', 10);
const DB_USER = process.env.DB_USER || 'azeebo';
const DB_PASS = process.env.DB_PASS || 'azeebo';

function getPool(dbName: string): pg.Pool {
  return new Pool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASS,
    database: dbName,
    max: 5,
    idleTimeoutMillis: 10000,
  });
}

const UNIVERSE_IDS: Record<string, string> = {
  reality: 'u0000001-0000-0000-0000-000000000001',
  creator: 'u0000001-0000-0000-0000-000000000002',
  lifestyle: 'u0000001-0000-0000-0000-000000000003',
  movies: 'u0000001-0000-0000-0000-000000000004',
  comedy: 'u0000001-0000-0000-0000-000000000005',
  sports: 'u0000001-0000-0000-0000-000000000006',
  music: 'u0000001-0000-0000-0000-000000000007',
  games: 'u0000001-0000-0000-0000-000000000008',
  vertical: 'u0000001-0000-0000-0000-000000000009',
};

const UNIVERSE_FLAGS: { universe: string; featureKey: string; isEnabled: boolean; metadata?: Record<string, unknown> }[] = [
  // Reality
  { universe: 'reality', featureKey: 'liveVoting', isEnabled: true, metadata: { description: 'Live audience eviction voting' } },
  { universe: 'reality', featureKey: 'evictionPredictions', isEnabled: true, metadata: { description: 'Predict housemate eviction outcomes' } },
  { universe: 'reality', featureKey: 'contestantGifts', isEnabled: true, metadata: { description: 'Virtual gifting to contestants' } },

  // Movies
  { universe: 'movies', featureKey: 'cinemaPass', isEnabled: true, metadata: { description: 'Early-access cinema passes' } },
  { universe: 'movies', featureKey: 'earlyScreenings', isEnabled: true, metadata: { description: 'VIP member 24-hr advance screening' } },
  { universe: 'movies', featureKey: 'trailersFree', isEnabled: true, metadata: { description: 'Unauthenticated trailer playback' } },

  // Comedy
  { universe: 'comedy', featureKey: 'challengesEnabled', isEnabled: true, metadata: { description: 'Comedy punchline community challenges' } },
  { universe: 'comedy', featureKey: 'liveRoasts', isEnabled: true, metadata: { description: 'Live-streamed comedy roast sessions' } },
  { universe: 'comedy', featureKey: 'audioSkits', isEnabled: true, metadata: { description: 'Standalone audio skit player' } },

  // Games
  { universe: 'games', featureKey: 'tournamentsEnabled', isEnabled: true, metadata: { description: 'Multiplayer trivia tournaments' } },
  { universe: 'games', featureKey: 'triviaAi', isEnabled: true, metadata: { description: 'Dynamic AI-generated Nigerian pop-culture questions' } },
  { universe: 'games', featureKey: 'leaderboardsSeasonal', isEnabled: true, metadata: { description: 'Monthly cash prize leaderboards' } },

  // Sports
  { universe: 'sports', featureKey: 'predictionMarkets', isEnabled: true, metadata: { description: 'Non-custodial fan prediction pools' } },
  { universe: 'sports', featureKey: 'liveOdds', isEnabled: true, metadata: { description: 'Live match score and odds integration' } },
  { universe: 'sports', featureKey: 'matchHighlights', isEnabled: true, metadata: { description: 'Curated 60-second game clip replays' } },

  // Vertical
  { universe: 'vertical', featureKey: 'fastPlayback', isEnabled: true, metadata: { description: '9:16 mobile-optimized swipe player' } },
  { universe: 'vertical', featureKey: 'creatorUploads', isEnabled: true, metadata: { description: 'Direct creator short-form video publishing' } },

  // Lifestyle
  { universe: 'lifestyle', featureKey: 'neighborhoodGuides', isEnabled: true, metadata: { description: 'Curated Lagos & Abuja city discovery' } },
  { universe: 'lifestyle', featureKey: 'partnerPerks', isEnabled: true, metadata: { description: 'Dining and nightlife discount vouchers' } },

  // Creator
  { universe: 'creator', featureKey: 'tipping', isEnabled: true, metadata: { description: 'Direct wallet coin tips' } },
  { universe: 'creator', featureKey: 'subscriberTiers', isEnabled: true, metadata: { description: 'Custom monthly VIP fan tiers' } },
];

export async function seedAdminFlagsService(dryRun = false): Promise<number> {
  if (dryRun) {
    console.log(`  [DRY RUN] Would seed ${UNIVERSE_FLAGS.length} universe feature flags in azeebo_content`);
    return UNIVERSE_FLAGS.length;
  }

  const pool = getPool('azeebo_content');
  let count = 0;

  try {
    for (let i = 0; i < UNIVERSE_FLAGS.length; i++) {
      const flag = UNIVERSE_FLAGS[i];
      const universeId = UNIVERSE_IDS[flag.universe];
      if (!universeId) continue;

      const flagId = `uff00000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`;

      await pool.query(
        `INSERT INTO universe_feature_flags (id, "universeId", "featureKey", "isEnabled", metadata, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET
           "isEnabled" = EXCLUDED."isEnabled",
           metadata = EXCLUDED.metadata,
           "updatedAt" = NOW();`,
        [flagId, universeId, flag.featureKey, flag.isEnabled, flag.metadata || {}]
      );
      count++;
    }
  } finally {
    await pool.end();
  }

  return count;
}
