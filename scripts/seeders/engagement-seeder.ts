/**
 * Engagement Service Seeder — Azeebo+
 *
 * Populates leaderboard entries, rankings, and predictions in azeebo_engagement.
 * Fully idempotent.
 */

import pg from 'pg';
import { seedImages } from './seed-image-hosts.js';

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

const LEADERBOARD_USERS = [
  { id: 'usr-0001', name: 'Chioma Adebayo', avatar: seedImages.unsplash('photo-1534528741775-53994a69daeb', 200, 200), score: 18450, rank: 1 },
  { id: 'usr-0002', name: 'Emeka Okafor', avatar: seedImages.unsplash('photo-1507003211169-0a1dd7228f2d', 200, 200), score: 16200, rank: 2 },
  { id: 'usr-0003', name: 'Amina Bello', avatar: seedImages.unsplash('photo-1517841905240-472988babdf9', 200, 200), score: 14100, rank: 3 },
  { id: 'usr-0004', name: 'Tunde Bakare', avatar: seedImages.unsplash('photo-1500648767791-00dcc994a43e', 200, 200), score: 12800, rank: 4 },
  { id: 'usr-0005', name: 'Ngozi Eze', avatar: seedImages.unsplash('photo-1494790108377-be9c29b29330', 200, 200), score: 11450, rank: 5 },
  { id: 'usr-0006', name: 'Femi Otedola', avatar: seedImages.unsplash('photo-1506794778202-cad84cf45f1d', 200, 200), score: 9900, rank: 6 },
  { id: 'usr-0007', name: 'Zainab Danjuma', avatar: seedImages.unsplash('photo-1524504388940-b1c1722653e1', 200, 200), score: 8750, rank: 7 },
  { id: 'usr-0008', name: 'Kayode Alabi', avatar: seedImages.unsplash('photo-1519085360753-af0119f7cbe7', 200, 200), score: 7600, rank: 8 },
  { id: 'usr-0009', name: 'Halima Sadiq', avatar: seedImages.unsplash('photo-1544005313-94ddf0286df2', 200, 200), score: 6400, rank: 9 },
  { id: 'usr-0010', name: 'Chinedu Ibe', avatar: seedImages.unsplash('photo-1501196354995-cbb51c65aaea', 200, 200), score: 5200, rank: 10 },
];

export async function seedEngagementService(dryRun = false): Promise<number> {
  if (dryRun) {
    console.log('  [DRY RUN] Would seed 20 leaderboard entries, 20 rankings, and 15 predictions in azeebo_engagement');
    return 55;
  }

  const pool = getPool('azeebo_engagement');
  let count = 0;

  try {
    // 1. Leaderboard entries (weekly & all-time)
    for (const u of LEADERBOARD_USERS) {
      // Weekly
      await pool.query(
        `INSERT INTO leaderboard_entries (id, "userId", "displayName", avatar, score, rank, category, "timePeriod", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, 'all', 'weekly', NOW(), NOW())
         ON CONFLICT ("userId", category, "timePeriod") DO UPDATE SET
           score = EXCLUDED.score,
           rank = EXCLUDED.rank,
           "displayName" = EXCLUDED."displayName",
           avatar = EXCLUDED.avatar,
           "updatedAt" = NOW();`,
        [u.id, u.name, u.avatar, Math.round(u.score * 0.3), u.rank]
      );
      count++;

      // Monthly
      await pool.query(
        `INSERT INTO leaderboard_entries (id, "userId", "displayName", avatar, score, rank, category, "timePeriod", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, 'all', 'monthly', NOW(), NOW())
         ON CONFLICT ("userId", category, "timePeriod") DO UPDATE SET
           score = EXCLUDED.score,
           rank = EXCLUDED.rank,
           "displayName" = EXCLUDED."displayName",
           avatar = EXCLUDED.avatar,
           "updatedAt" = NOW();`,
        [u.id, u.name, u.avatar, u.score, u.rank]
      );
      count++;
    }

    // 2. Rankings (all-time & reality)
    for (const u of LEADERBOARD_USERS) {
      await pool.query(
        `INSERT INTO rankings (id, "userId", "displayName", avatar, category, score, rank, period, "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, 'reality', $4, $5, 'all', NOW(), NOW())
         ON CONFLICT ("userId", category, period) DO UPDATE SET
           score = EXCLUDED.score,
           rank = EXCLUDED.rank,
           "displayName" = EXCLUDED."displayName",
           avatar = EXCLUDED.avatar,
           "updatedAt" = NOW();`,
        [u.id, u.name, u.avatar, u.score, u.rank]
      );
      count++;
    }

    // 3. Predictions
    const predictions = [
      { id: 'prd-001', userId: 'usr-0001', contentId: 'cnt-reality-001', prediction: 'Team Green wins immunity challenge', points: 250, isCorrect: true, result: 'won', category: 'reality', status: 'settled' },
      { id: 'prd-002', userId: 'usr-0002', contentId: 'cnt-reality-002', prediction: 'Adeleke evicted this week', points: 150, isCorrect: false, result: 'lost', category: 'reality', status: 'settled' },
      { id: 'prd-003', userId: 'usr-0003', contentId: 'cnt-sports-001', prediction: 'Enyimba FC wins by 2 goals', points: 300, isCorrect: true, result: 'won', category: 'sports', status: 'settled' },
      { id: 'prd-004', userId: 'usr-0004', contentId: 'cnt-sports-002', prediction: 'Remo Stars scores first half', points: 200, isCorrect: null, result: null, category: 'sports', status: 'active' },
      { id: 'prd-005', userId: 'usr-0005', contentId: 'cnt-games-001', prediction: 'Lagos Tigers win FIFA 26 tournament', points: 500, isCorrect: null, result: null, category: 'games', status: 'active' },
    ];

    for (const p of predictions) {
      await pool.query(
        `INSERT INTO predictions (id, "userId", "contentId", prediction, points, "isCorrect", result, category, metadata, status, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '{}', $9, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET
           prediction = EXCLUDED.prediction,
           points = EXCLUDED.points,
           "isCorrect" = EXCLUDED."isCorrect",
           result = EXCLUDED.result,
           status = EXCLUDED.status,
           "updatedAt" = NOW();`,
        [p.id, p.userId, p.contentId, p.prediction, p.points, p.isCorrect, p.result, p.category, p.status]
      );
      count++;
    }
  } finally {
    await pool.end();
  }

  return count;
}
