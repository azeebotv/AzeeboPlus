/**
 * Reward Service Seeder — Azeebo+
 *
 * Populates levels, badges, and the rewards catalog in azeebo_reward.
 * Fully idempotent (uses deterministic IDs matching schema & ON CONFLICT).
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

export async function seedRewardService(dryRun = false): Promise<number> {
  if (dryRun) {
    console.log('  [DRY RUN] Would seed 6 levels, 8 badges, and 6 catalog rewards in azeebo_reward');
    return 20;
  }

  const pool = getPool('azeebo_reward');
  let count = 0;

  try {
    // 1. Levels (match canonical rank and UUIDs)
    const levels = [
      { id: 'lvl-00001-0000-0000-0000-000000000001', name: 'Bronze Explorer', rank: 1, minPoints: 0, icon: '🥉', color: '#CD7F32' },
      { id: 'lvl-00001-0000-0000-0000-000000000002', name: 'Silver Fanatic', rank: 2, minPoints: 500, icon: '🥈', color: '#C0C0C0' },
      { id: 'lvl-00001-0000-0000-0000-000000000003', name: 'Gold VIP', rank: 3, minPoints: 2000, icon: '🥇', color: '#FFD700' },
      { id: 'lvl-00001-0000-0000-0000-000000000004', name: 'Platinum Star', rank: 4, minPoints: 5000, icon: '⭐', color: '#E5E4E2' },
      { id: 'lvl-00001-0000-0000-0000-000000000005', name: 'Diamond Legend', rank: 5, minPoints: 15000, icon: '💎', color: '#00F5D4' },
      { id: 'lvl-00001-0000-0000-0000-000000000006', name: 'Azeebo Icon', rank: 6, minPoints: 50000, icon: '👑', color: '#8338EC' },
    ];

    for (const lvl of levels) {
      await pool.query(
        `INSERT INTO levels (id, name, rank, "minPoints", icon, color, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         ON CONFLICT (rank) DO UPDATE SET
           name = EXCLUDED.name,
           "minPoints" = EXCLUDED."minPoints",
           icon = EXCLUDED.icon,
           color = EXCLUDED.color,
           "updatedAt" = NOW();`,
        [lvl.id, lvl.name, lvl.rank, lvl.minPoints, lvl.icon, lvl.color]
      );
      count++;
    }

    // 2. Badges
    const badges = [
      { id: 'bdg-00001-0000-0000-0000-000000000001', name: 'First Stream', description: 'Watched your first show on Azeebo+', icon: '🎬', points: 50 },
      { id: 'bdg-00002-0000-0000-0000-000000000002', name: '7-Day Streak', description: 'Logged in and watched 7 days consecutively', icon: '🔥', points: 200 },
      { id: 'bdg-00003-0000-0000-0000-000000000003', name: 'Super Voter', description: 'Voted in 10 Reality TV eviction polls', icon: '🗳️', points: 300 },
      { id: 'bdg-00004-0000-0000-0000-000000000004', name: 'Top Tipper', description: 'Tipped a creator using wallet coins', icon: '💸', points: 150 },
      { id: 'bdg-00005-0000-0000-0000-000000000005', name: 'Festival Insider', description: 'Participated in a live premiere chat drop', icon: '🎟️', points: 500 },
      { id: 'bdg-00006-0000-0000-0000-000000000006', name: 'Referral Master', description: 'Referred 5 friends who joined Azeebo+', icon: '🤝', points: 750 },
      { id: 'bdg-00007-0000-0000-0000-000000000007', name: 'Early Adopter', description: 'Joined during the Azeebo+ launch phase', icon: '🚀', points: 300 },
      { id: 'bdg-00008-0000-0000-0000-000000000008', name: 'Quiz Whiz', description: 'Scored 100% on 3 trivia quizzes', icon: '🧠', points: 400 },
    ];

    for (const b of badges) {
      await pool.query(
        `INSERT INTO badges (id, name, description, icon, points, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           icon = EXCLUDED.icon,
           points = EXCLUDED.points,
           "updatedAt" = NOW();`,
        [b.id, b.name, b.description, b.icon, b.points]
      );
      count++;
    }

    // 3. Rewards Catalog
    const rewards = [
      { id: 'rp000000-0000-0000-0000-000000000001', name: 'Daily Login Bonus', description: 'Earn points for logging into Azeebo+ daily', cost: 10, type: 'points' },
      { id: 'rp000000-0000-0000-0000-000000000002', name: 'Content Watch Reward', description: 'Earn points for watching any full episode or film', cost: 5, type: 'points' },
      { id: 'rp000000-0000-0000-0000-000000000003', name: 'Referral Bonus', description: 'Earn points for referring friends who sign up', cost: 500, type: 'points' },
      { id: 'rp000000-0000-0000-0000-000000000004', name: 'Creator Milestone', description: 'Earn points for reaching follower & viewer milestones', cost: 1000, type: 'points' },
      { id: 'rp000000-0000-0000-0000-000000000005', name: 'VIP Cinema Premiere Pass', description: 'Redeem points for 24hr early access to new Nollywood releases', cost: 2500, type: 'perk' },
      { id: 'rp000000-0000-0000-0000-000000000006', name: 'Azeebo+ Merch Voucher', description: '₦5,000 off official Azeebo+ festival merchandise', cost: 5000, type: 'voucher' },
    ];

    for (const r of rewards) {
      await pool.query(
        `INSERT INTO rewards (id, name, description, cost, type, "isActive", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           cost = EXCLUDED.cost,
           type = EXCLUDED.type,
           "updatedAt" = NOW();`,
        [r.id, r.name, r.description, r.cost, r.type]
      );
      count++;
    }
  } finally {
    await pool.end();
  }

  return count;
}
