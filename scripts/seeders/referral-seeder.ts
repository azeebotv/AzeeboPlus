/**
 * Referral Service Seeder — Azeebo+
 *
 * Populates referral codes, referrals, and referral reward allocations in azeebo_referral.
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

export async function seedReferralService(dryRun = false): Promise<number> {
  const REFERRAL_COUNT = 30;
  if (dryRun) {
    console.log(`  [DRY RUN] Would seed ${REFERRAL_COUNT} referrals and codes in azeebo_referral`);
    return REFERRAL_COUNT * 2;
  }

  const pool = getPool('azeebo_referral');
  let count = 0;

  try {
    // 1. Referral Codes for first 20 users
    for (let i = 1; i <= 20; i++) {
      const userId = `usr${String(i).padStart(4, '0')}`;
      const code = `AZP${String(i).padStart(3, '0')}`;
      const codeId = `rc000000-0000-0000-0000-${String(i).padStart(12, '0')}`;

      await pool.query(
        `INSERT INTO referral_codes (id, "userId", code, "isActive", "maxUses", "currentUses", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, true, 50, 2, NOW(), NOW())
         ON CONFLICT (code) DO UPDATE SET "isActive" = true, "updatedAt" = NOW();`,
        [codeId, userId, code]
      );
      count++;
    }

    // 2. Referrals & Rewards
    for (let i = 1; i <= REFERRAL_COUNT; i++) {
      const refId = `rf000000-0000-0000-0000-${String(i).padStart(12, '0')}`;
      const referrerIdx = (i % 20) + 1;
      const referredIdx = ((i + 5) % 30) + 21;
      const referrerId = `usr${String(referrerIdx).padStart(4, '0')}`;
      const referredId = `usr${String(referredIdx).padStart(4, '0')}`;
      const codeId = `rc000000-0000-0000-0000-${String(referrerIdx).padStart(12, '0')}`;
      const status = i % 3 === 0 ? 'completed' : i % 3 === 1 ? 'pending' : 'completed';
      const rewardAmount = 500.0;
      const rewardStatus = status === 'completed' ? 'credited' : 'pending';

      await pool.query(
        `INSERT INTO referrals (id, "referrerId", "referredId", "referralCodeId", status, "rewardAmount", "rewardStatus", "completedAt", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() - INTERVAL '15 days', NOW())
         ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, "rewardStatus" = EXCLUDED."rewardStatus";`,
        [
          refId,
          referrerId,
          referredId,
          codeId,
          status,
          rewardAmount,
          rewardStatus,
          status === 'completed' ? new Date() : null,
        ]
      );
      count++;

      if (status === 'completed') {
        const rewardId = `rw000000-0000-0000-0000-${String(i).padStart(12, '0')}`;
        await pool.query(
          `INSERT INTO referral_rewards (id, "referralId", "userId", amount, type, status, "creditedAt", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, 'points', 'credited', NOW(), NOW(), NOW())
           ON CONFLICT (id) DO NOTHING;`,
          [rewardId, refId, referrerId, rewardAmount]
        );
        count++;
      }
    }
  } finally {
    await pool.end();
  }

  return count;
}
