/**
 * Search Service Seeder — Azeebo+
 *
 * Populates suggestions and synchronizes content items from azeebo_content into azeebo_search.
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

const SUGGESTIONS = [
  { term: 'bbnaija', type: 'trending', universe: 'reality', weight: 10 },
  { term: 'nollywood', type: 'trending', universe: 'movies', weight: 9 },
  { term: 'comedy skits', type: 'trending', universe: 'comedy', weight: 8 },
  { term: 'afcon 2026', type: 'trending', universe: 'sports', weight: 8 },
  { term: 'lagos nightlife', type: 'trending', universe: 'lifestyle', weight: 7 },
  { term: 'vertical shorts', type: 'trending', universe: 'vertical', weight: 6 },
  { term: 'esports tournament', type: 'trending', universe: 'games', weight: 6 },
  { term: 'sabinus', type: 'creator', universe: 'comedy', weight: 7 },
  { term: 'taaooma', type: 'creator', universe: 'comedy', weight: 7 },
  { term: 'king of boys', type: 'movie', universe: 'movies', weight: 9 },
  { term: 'street food crawl', type: 'guide', universe: 'lifestyle', weight: 5 },
  { term: 'afrobeats live', type: 'music', universe: 'music', weight: 8 },
];

export async function seedSearchService(dryRun = false): Promise<number> {
  if (dryRun) {
    console.log(`  [DRY RUN] Would seed ${SUGGESTIONS.length} search suggestions and sync content to azeebo_search`);
    return SUGGESTIONS.length + 30;
  }

  const searchPool = getPool('azeebo_search');
  const contentPool = getPool('azeebo_content');
  let count = 0;

  try {
    // 1. Seed search suggestions using gen_random_uuid() and ON CONFLICT (term)
    for (const s of SUGGESTIONS) {
      await searchPool.query(
        `INSERT INTO suggestions (id, term, type, universe, weight, "isActive", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, true, NOW(), NOW())
         ON CONFLICT (term) DO UPDATE SET weight = EXCLUDED.weight, "updatedAt" = NOW();`,
        [s.term, s.type, s.universe, s.weight]
      );
      count++;
    }

    // 2. Synchronize content items from azeebo_content into azeebo_search
    const contentRows = await contentPool.query(
      `SELECT id, title, description, thumbnail, "universeId", status, "viewCount", "creatorId", metadata
       FROM content_items
       WHERE status = 'published'
       LIMIT 300;`
    );

    for (const item of contentRows.rows) {
      const duration = (item.metadata as { duration?: number })?.duration || 1800;
      const categories = (item.metadata as { categories?: string[] })?.categories || ['Trending Now'];

      await searchPool.query(
        `INSERT INTO content_items (id, title, description, thumbnail, duration, "universeId", universe, "contentType", status, "viewCount", "creatorId", categories, metadata, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'video', $8, $9, $10, $11, $12, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           thumbnail = EXCLUDED.thumbnail,
           duration = EXCLUDED.duration,
           categories = EXCLUDED.categories,
           "viewCount" = EXCLUDED."viewCount",
           metadata = EXCLUDED.metadata,
           "updatedAt" = NOW();`,
        [
          item.id,
          item.title,
          item.description,
          item.thumbnail,
          duration,
          item.universeId,
          item.universeId,
          item.status,
          item.viewCount,
          item.creatorId,
          categories,
          item.metadata || {},
        ]
      );
      count++;
    }
  } finally {
    await searchPool.end();
    await contentPool.end();
  }

  return count;
}
