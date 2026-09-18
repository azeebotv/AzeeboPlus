#!/usr/bin/env node
// Sync published content rows from azeebo_content into azeebo_search.
// The search service reads its own DB copy; no dblink/FDW locally, so this
// exports a CSV and upserts through a staging table (idempotent, re-runnable).
import { execSync } from 'node:child_process';

const ENV = { ...process.env, PGPASSWORD: 'change-me-in-production' };

const PSQL = (db, sql, quiet = true) =>
  execSync(`psql -h localhost -U postgres -d ${db} ${quiet ? '-q' : ''} -v ON_ERROR_STOP=1`, {
    env: ENV,
    encoding: 'utf8',
    input: sql,
  });

// 1. Export published rows to CSV (narrow column set, search-table order)
PSQL(
  'azeebo_content',
  `\\copy (SELECT ci.id, ci.title, COALESCE(ci.description,''), ci.thumbnail, ci."universeId", COALESCE(u.name,'reality') AS universe, ci.status, ci."viewCount", ci."creatorId", 'video' AS "contentType", ci."createdAt", ci."updatedAt" FROM content_items ci LEFT JOIN universes u ON u.id = ci."universeId" WHERE ci.status='published') TO /tmp/search-content.csv WITH (FORMAT csv)`
);

// 2. Stage + upsert into search DB
PSQL(
  'azeebo_search',
  `
DROP TABLE IF EXISTS tmp_search_stage;
CREATE TABLE tmp_search_stage (
  id text, title text, description text, thumbnail text,
  "universeId" text, universe text, status text, "viewCount" integer,
  "creatorId" text, "contentType" text, "createdAt" timestamp, "updatedAt" timestamp
);
\\copy tmp_search_stage FROM /tmp/search-content.csv WITH (FORMAT csv)
INSERT INTO content_items
  (id, title, description, thumbnail, "universeId", universe, status, "viewCount", "creatorId", "contentType", "createdAt", "updatedAt")
SELECT id, title, description, thumbnail, "universeId", universe, status, "viewCount", "creatorId", "contentType", "createdAt", "updatedAt"
FROM tmp_search_stage
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  thumbnail = EXCLUDED.thumbnail,
  universe = EXCLUDED.universe,
  status = EXCLUDED.status,
  "viewCount" = EXCLUDED."viewCount",
  "updatedAt" = EXCLUDED."updatedAt";
DROP TABLE tmp_search_stage;`
);

const out = PSQL(
  'azeebo_search',
  `SELECT status, COUNT(*) FROM content_items GROUP BY status ORDER BY 1;`,
  false
);
console.log('search index synced:\n' + out.trim());
