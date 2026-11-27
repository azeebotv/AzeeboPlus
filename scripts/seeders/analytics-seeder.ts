/**
 * Analytics Service Seeder — Azeebo+
 *
 * Populates 30 days of realistic product events and session summaries in azeebo_analytics.
 * Fully idempotent (uses deterministic IDs & ON CONFLICT).
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

const UNIVERSES = ['reality', 'movies', 'comedy', 'sports', 'games', 'vertical', 'lifestyle'];
const PLATFORMS = ['web', 'ios', 'android'];

export async function seedAnalyticsService(dryRun = false): Promise<number> {
  const DAYS = 30;
  const EVENTS_PER_DAY = 5;
  const TOTAL = DAYS * EVENTS_PER_DAY;

  if (dryRun) {
    console.log(`  [DRY RUN] Would seed ${TOTAL} analytics product events + ${DAYS} session summaries in azeebo_analytics`);
    return TOTAL + DAYS;
  }

  const pool = getPool('azeebo_analytics');
  let count = 0;

  try {
    for (let day = 0; day < DAYS; day++) {
      const daysAgo = DAYS - day;
      const sessionId = `ses00000-0000-0000-0000-${String(day + 1).padStart(12, '0')}`;
      const universe = UNIVERSES[day % UNIVERSES.length];
      const platform = PLATFORMS[day % PLATFORMS.length];
      const userId = `usr${String((day % 20) + 1).padStart(4, '0')}`;

      // 1. Session Summary
      await pool.query(
        `INSERT INTO session_summaries (id, "sessionId", "userId", platform, universe, "startedAt", "endedAt", "durationSeconds", "screenViews", "eventsCount", conversions, metadata, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, NOW() - ($6 || ' days')::INTERVAL, NOW() - ($6 || ' days')::INTERVAL + INTERVAL '45 minutes', 2700, 8, 14, 1, '{"geo": "NG"}', NOW(), NOW())
         ON CONFLICT ("sessionId") DO NOTHING;`,
        [sessionId, sessionId, userId, platform, universe, daysAgo]
      );
      count++;

      // 2. Product Events
      const eventTypes = ['content_view', 'stream_started', 'vote_submitted', 'item_saved', 'search_executed'];
      for (let e = 0; e < eventTypes.length; e++) {
        const eventId = `ae000000-0000-0000-${String(day + 1).padStart(4, '0')}-${String(e + 1).padStart(12, '0')}`;
        const eventName = eventTypes[e];

        await pool.query(
          `INSERT INTO product_events (id, "eventName", "userId", "sessionId", platform, universe, timestamp, metadata, "createdAt")
           VALUES ($1, $2, $3, $4, $5, $6, NOW() - ($7 || ' days')::INTERVAL + ($8 || ' minutes')::INTERVAL, '{"device": "mobile", "region": "Lagos"}', NOW())
           ON CONFLICT (id) DO NOTHING;`,
          [eventId, eventName, userId, sessionId, platform, universe, daysAgo, e * 8]
        );
        count++;
      }
    }
  } finally {
    await pool.end();
  }

  return count;
}
