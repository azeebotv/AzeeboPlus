#!/usr/bin/env node
// ============================================================================
// enrich-seed-content.mjs — give the seeded universes real filter/sort data.
//
// The seed script (seed-universe-content-30.mjs) created 30 published items
// per universe but left the fields the browse/search filters and sort options
// need empty: no category links (_CategoryToContentItem), no duration, and a
// single repeating placeholder thumbnail. This script enriches every
// published item:
//   • categories  — deterministic per-universe category links from the 8
//     seeded categories (Trending Now, New Releases, Editor Picks, Exclusive,
//     Free Content, Live Events, Nollywood Classics, Documentaries)
//   • duration    — per-universe realistic ranges (music ~4min, movies ~2h,
//     vertical ~1min, ...) written to metadata.duration (seconds) — the field
//     the search page's duration filter actually reads
//   • thumbnails  — varied across the 30 placeholder images
//   • metadata    — genre, contentRating, tags for cards and future filters
//
// Idempotent: deterministic derivation from item id, safe to re-run.
// Afterwards it syncs azeebo_search.content_items (categories text[], duration
// live there) so the search page's client-side filters work too.
//
// Usage: node scripts/enrich-seed-content.mjs
// ============================================================================
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const ENV = { ...process.env, PGPASSWORD: 'change-me-in-production' };

const PSQL = (db, sql, { tuples = false } = {}) =>
  execSync(`psql -h localhost -U azeebo -d ${db} ${tuples ? '-tA' : '-q -v ON_ERROR_STOP=1'}`, {
    env: ENV,
    encoding: 'utf8',
    input: sql,
  });

// Deterministic pseudo-random from a string seed (stable across re-runs).
function seededInt(str, min, max) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return min + (Math.abs(h) % (max - min + 1));
}

const UNIVERSE_PROFILE = {
  // universe name: [duration range seconds, genres, rating pool]
  reality: [[1500, 3600], ['Reality', 'Drama', 'Lifestyle'], ['PG', 'PG-13', '18+']],
  creator: [[300, 1500], ['Vlog', 'Tutorial', 'Lifestyle'], ['PG', 'PG-13']],
  lifestyle: [[600, 2400], ['Lifestyle', 'Travel', 'Fashion'], ['PG', 'G']],
  movies: [[4500, 7200], ['Nollywood', 'Drama', 'Thriller'], ['PG-13', 'R', '18+']],
  comedy: [[180, 900], ['Comedy', 'Skits', 'Stand-up'], ['PG', 'PG-13']],
  sports: [[300, 5400], ['Sports', 'Highlights', 'Analysis'], ['G', 'PG']],
  music: [[180, 420], ['Afrobeats', 'Gospel', 'Fuji'], ['G', 'PG']],
  games: [[900, 7200], ['Gaming', 'Esports', 'Streaming'], ['PG', 'PG-13']],
  vertical: [[50, 180], ['Short-form', 'Drama', 'Romance'], ['PG-13', '18+']],
};

// Per-universe category affinity: which of the 8 seeded categories each
// universe's items most plausibly belong to. Every item gets 2-3 categories:
// its affinity picks plus a deterministic extra so every category has members
// in most universes (browse category filter never returns an empty universe).
const CATEGORY_SLUGS = [
  'trending-now',
  'new-releases',
  'editor-picks',
  'exclusive',
  'free-content',
  'live-events',
  'nollywood-classics',
  'documentaries',
];

const UNIVERSE_CATEGORY_AFFINITY = {
  reality: ['trending-now', 'live-events', 'exclusive'],
  creator: ['free-content', 'new-releases', 'editor-picks'],
  lifestyle: ['editor-picks', 'free-content', 'new-releases'],
  movies: ['nollywood-classics', 'exclusive', 'new-releases'],
  comedy: ['free-content', 'trending-now', 'editor-picks'],
  sports: ['live-events', 'trending-now', 'free-content'],
  music: ['trending-now', 'live-events', 'new-releases'],
  games: ['trending-now', 'live-events', 'free-content'],
  vertical: ['free-content', 'trending-now', 'new-releases'],
};

const EXTRA_CATEGORIES = ['documentaries', 'exclusive', 'editor-picks'];

// 1. Load published items via -tAc (unaligned, tuples-only) so the JSON is parseable
const itemsJson = PSQL(
  'azeebo_content',
  `SELECT json_agg(t)::text FROM (
     SELECT ci.id, ci.title, ci."universeId", u.name AS universe, ci.metadata
     FROM content_items ci JOIN universes u ON u.id = ci."universeId"
     WHERE ci.status = 'published'
   ) t;`,
  { tuples: true }
);
const items = JSON.parse(itemsJson.trim());

// 2. Load category id map (-tAc unaligned)
const catsJson = PSQL('azeebo_content', `SELECT COALESCE(json_agg(t),'[]'::json)::text FROM (SELECT id, slug FROM categories) t;`, { tuples: true });
const categories = JSON.parse(catsJson.trim());
const catIdBySlug = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

const catLinks = [];
const updates = [];

const UNIVERSE_PHOTOS = {
  movie: ['photo-1536440136628-849c177e76a1', 'photo-1485846234645-a62644f84728', 'photo-1478720568477-152d9b164e26', 'photo-1518676599649-7c77c68b753a', 'photo-1594909122845-11baa439b7bf', 'photo-1574267432553-4b4628081c31', 'photo-1517604931442-7e0c8ed2963c', 'photo-1509281373149-e957c6296406'],
  movies: ['photo-1536440136628-849c177e76a1', 'photo-1485846234645-a62644f84728', 'photo-1478720568477-152d9b164e26', 'photo-1518676599649-7c77c68b753a', 'photo-1594909122845-11baa439b7bf', 'photo-1574267432553-4b4628081c31', 'photo-1517604931442-7e0c8ed2963c', 'photo-1509281373149-e957c6296406'],
  reality: ['photo-1516450360452-9312f5e86fc7', 'photo-1492684223066-81342ee5ff30', 'photo-1514525253161-7a46d19cd819', 'photo-1501386761578-eac5c94b800a', 'photo-1520523839898-507127027d86', 'photo-1524368535928-5b5e00ddc76b', 'photo-1512917774080-9991f1c4c750'],
  music: ['photo-1511671782779-c97d3d27a1d4', 'photo-1470225620780-dba8ba36b745', 'photo-1514525253161-7a46d19cd819', 'photo-1508700115892-45ecd05ae2ad', 'photo-1465847899084-d164df4dedc6', 'photo-1511735111819-9a3f7709049c'],
  comedy: ['photo-1585699324551-f6c309eedeca', 'photo-1527224857830-43a7acc85260', 'photo-1516450360452-9312f5e86fc7', 'photo-1507676184212-d03ab07a01bf', 'photo-1514525253161-7a46d19cd819'],
  sports: ['photo-1508098682722-e99c43a406b2', 'photo-1574629810360-7efbbe195018', 'photo-1517649763962-0c623266ddc0', 'photo-1431324155629-1a6deb1dec8d', 'photo-1560272564-c83b66b1ad12'],
  lifestyle: ['photo-1507525428034-b723cf961d3e', 'photo-1512917774080-9991f1c4c750', 'photo-1517248135467-4c7edcad34c4', 'photo-1492684223066-81342ee5ff30', 'photo-1506157786151-b8491531f063'],
  games: ['photo-1542751371-adc38448a05e', 'photo-1511512578047-dfb367046420', 'photo-1538481199705-c710c4e965fc', 'photo-1550745165-9bc0b252726f'],
  creator: ['photo-1518173946687-a4c8a383392e', 'photo-1598488035139-bdbb2231ce04', 'photo-1574717024653-61fd2cf4d44d', 'photo-1516321318423-f06f85e504b3'],
  vertical: ['photo-1534528741775-53994a69daeb', 'photo-1507003211169-0a1dd7228f2d', 'photo-1500648767791-00dcc994a43e', 'photo-1494790108377-be9c29b29330'],
};

for (const item of items) {
  const profile = UNIVERSE_PROFILE[item.universe] ?? UNIVERSE_PROFILE.creator;
  const [minDur, maxDur] = profile[0];
  const genres = profile[1];
  const ratings = profile[2];

  const duration = seededInt(item.id + 'dur', minDur, maxDur);
  const genre = genres[seededInt(item.id + 'gen', 0, genres.length - 1)];
  const rating = ratings[seededInt(item.id + 'rate', 0, ratings.length - 1)];
  // Real high-definition editorial thumbnail from Unsplash
  const photoPool = UNIVERSE_PHOTOS[item.universe] ?? UNIVERSE_PHOTOS.movie;
  const photoId = photoPool[seededInt(item.id + 'photo', 0, photoPool.length - 1)];
  const thumbnail = `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=800&h=450&q=80`;

  const meta = { ...(item.metadata ?? {}) };
  meta.duration = duration;
  meta.genre = genre;
  meta.contentRating = rating;
  // Language (the browse Language filter posts ISO 639-1 codes) and release
  // year (Year filter) so those dropdowns filter on real data instead of no-ops.
  const LANGS = [['en', 'English'], ['yo', 'Yoruba'], ['ig', 'Igbo'], ['ha', 'Hausa'], ['pi', 'Pidgin']];
  const [langCode, langLabel] = LANGS[seededInt(item.id + 'lang', 0, LANGS.length - 1)];
  meta.language = langCode;
  meta.languageLabel = langLabel;
  const nowY = new Date().getFullYear();
  meta.releaseYear = nowY - seededInt(item.id + 'year', 0, 3); // 2026..2023
  meta.tags = [
    item.universe,
    genre.toLowerCase(),
    rating.toLowerCase().replace('+', ''),
    langCode,
    String(meta.releaseYear),
  ];

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  meta.durationLabel = `${minutes}:${String(seconds).padStart(2, '0')}`;

  updates.push(
    `UPDATE content_items SET thumbnail = '${thumbnail.replace(/'/g, "''")}', metadata = '${JSON.stringify(meta).replace(/'/g, "''")}'::jsonb, "updatedAt" = NOW() WHERE id = '${item.id}';`
  );

  // Categories: affinity picks (first 2) + one deterministic extra
  const affinity = UNIVERSE_CATEGORY_AFFINITY[item.universe] ?? CATEGORY_SLUGS.slice(0, 3);
  const picked = new Set(affinity.slice(0, 2));
  picked.add(affinity[2] ?? EXTRA_CATEGORIES[seededInt(item.id + 'cat', 0, EXTRA_CATEGORIES.length - 1)]);
  // Guarantee the item-indexed extra spreads across remaining categories
  if (seededInt(item.id + 'spread', 0, 4) === 0) {
    picked.add(CATEGORY_SLUGS[seededInt(item.id + 'cs', 0, CATEGORY_SLUGS.length - 1)]);
  }
  for (const slug of picked) {
    const catId = catIdBySlug[slug];
    if (catId) catLinks.push(`('${catId}', '${item.id}')`); // A=category, B=content
  }
}

// 3. Apply updates in chunks
const CHUNK = 100;
for (let i = 0; i < updates.length; i += CHUNK) {
  PSQL('azeebo_content', `BEGIN;\n${updates.slice(i, i + CHUNK).join('\n')}\nCOMMIT;`);
}

// 4. Category links (idempotent: prisma implicit join table, PK on both cols)
PSQL(
  'azeebo_content',
  `INSERT INTO "_CategoryToContentItem" ("A", "B")
   VALUES ${catLinks.join(',')}
   ON CONFLICT DO NOTHING;`
);

console.log(`Enriched ${updates.length} content items with ${catLinks.length} category links.`);

// 5. Sync search index (categories text[], duration live there)
const csvOut = '/tmp/enrich-content.csv';
PSQL(
  'azeebo_content',
  `\\copy (SELECT ci.id, ci.title, COALESCE(ci.description,''), ci.thumbnail, ci."universeId", COALESCE(u.name,'reality'), ci.status, ci."viewCount", ci."creatorId", 'video' AS "contentType", ci."createdAt", ci."updatedAt", COALESCE(m.duration, 0) AS duration, COALESCE(m.tags, ARRAY[]::text[]) AS categories FROM content_items ci LEFT JOIN universes u ON u.id = ci."universeId" LEFT JOIN LATERAL (SELECT (ci.metadata->>'duration')::integer AS duration, ARRAY(SELECT jsonb_array_elements_text(COALESCE(ci.metadata->'tags','[]'::jsonb))) AS tags) m ON true WHERE ci.status='published') TO ${csvOut} WITH (FORMAT csv)`
);

PSQL(
  'azeebo_search',
  `
DROP TABLE IF EXISTS tmp_search_stage;
CREATE TABLE tmp_search_stage (
  id text, title text, description text, thumbnail text,
  "universeId" text, universe text, status text, "viewCount" integer,
  "creatorId" text, "contentType" text, "createdAt" timestamp, "updatedAt" timestamp,
  duration integer, categories text[]
);
\\copy tmp_search_stage FROM ${csvOut} WITH (FORMAT csv)
INSERT INTO content_items
  (id, title, description, thumbnail, "universeId", universe, status, "viewCount", "creatorId", "contentType", "createdAt", "updatedAt", duration, categories)
SELECT id, title, description, thumbnail, "universeId", universe, status, "viewCount", "creatorId", "contentType", "createdAt", "updatedAt", duration, categories
FROM tmp_search_stage
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  thumbnail = EXCLUDED.thumbnail,
  universe = EXCLUDED.universe,
  status = EXCLUDED.status,
  "viewCount" = EXCLUDED."viewCount",
  "updatedAt" = EXCLUDED."updatedAt",
  duration = EXCLUDED.duration,
  categories = EXCLUDED.categories;
DROP TABLE tmp_search_stage;`
);

const searchCount = PSQL('azeebo_search', `SELECT COUNT(*) FROM content_items;`, false).match(/(\d+)/)?.[1];
console.log(`Search index synced — rows: ${searchCount}`);
