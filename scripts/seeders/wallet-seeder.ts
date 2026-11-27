/**
 * Wallet Service Seeder — Azeebo+
 *
 * Populates wallets, transactions, and ledger entries in azeebo_wallet.
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

const WALLET_USERS = [
  { id: 'w0000000-0000-0000-0000-000000000001', userId: 'a0000001-0000-0000-0000-000000000001', balance: 50000, bonus: 5000, promo: 2500 },
  { id: 'w0000000-0000-0000-0000-000000000002', userId: 'a0000001-0000-0000-0000-000000000003', balance: 12500, bonus: 1000, promo: 500 },
  { id: 'w0000000-0000-0000-0000-000000000003', userId: 'a0000001-0000-0000-0000-000000000004', balance: 8750, bonus: 500, promo: 200 },
  { id: 'w0000000-0000-0000-0000-000000000004', userId: 'a0000001-0000-0000-0000-000000000005', balance: 15000, bonus: 2000, promo: 1000 },
  { id: 'w0000000-0000-0000-0000-000000000005', userId: 'a0000001-0000-0000-0000-000000000006', balance: 25000, bonus: 1500, promo: 500 },
  { id: 'w0000000-0000-0000-0000-000000000006', userId: 'a0000001-0000-0000-0000-000000000007', balance: 2500, bonus: 200, promo: 100 },
  { id: 'w0000000-0000-0000-0000-000000000007', userId: 'a0000001-0000-0000-0000-000000000008', balance: 7500, bonus: 500, promo: 250 },
  { id: 'w0000000-0000-0000-0000-000000000008', userId: 'a0000001-0000-0000-0000-000000000011', balance: 32000, bonus: 3000, promo: 1000 },
  { id: 'w0000000-0000-0000-0000-000000000009', userId: 'a0000001-0000-0000-0000-000000000012', balance: 45000, bonus: 4000, promo: 2000 },
  { id: 'w0000000-0000-0000-0000-000000000010', userId: '00000000-0000-0000-0000-000000000002', balance: 10000, bonus: 1000, promo: 500 },
];

export async function seedWalletService(dryRun = false): Promise<number> {
  if (dryRun) {
    console.log(`  [DRY RUN] Would seed ${WALLET_USERS.length} wallets with transactions and ledger`);
    return WALLET_USERS.length * 3;
  }

  const pool = getPool('azeebo_wallet');
  let count = 0;

  try {
    for (const w of WALLET_USERS) {
      // 1. Wallets
      await pool.query(
        `INSERT INTO wallets (id, "userId", balance, "bonusBalance", "promoBalance", currency, version, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, 'NGN', 1, NOW(), NOW())
         ON CONFLICT ("userId") DO UPDATE SET
           balance = EXCLUDED.balance,
           "bonusBalance" = EXCLUDED."bonusBalance",
           "promoBalance" = EXCLUDED."promoBalance",
           "updatedAt" = NOW();`,
        [w.id, w.userId, w.balance, w.bonus, w.promo]
      );
      count++;

      // 2. Transactions
      const txRef = `tx-${w.userId.substring(0, 8)}-topup`;
      await pool.query(
        `INSERT INTO wallet_transactions (id, "walletId", type, amount, status, description, reference, provider, "idempotencyKey", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, 'credit', $2, 'completed', 'Paystack Wallet Top-up', $3, 'paystack', $4, NOW(), NOW())
         ON CONFLICT ("idempotencyKey") DO NOTHING;`,
        [w.id, w.balance, txRef, `idem-${txRef}`]
      );
      count++;

      // 3. Ledger
      await pool.query(
        `INSERT INTO wallet_ledger (id, "walletId", "userId", "operationType", amount, "balanceAfter", reference, "idempotencyKey", "createdAt")
         VALUES (gen_random_uuid()::text, $1, $2, 'top_up', $3, $3, $4, $5, NOW())
         ON CONFLICT ("idempotencyKey") DO NOTHING;`,
        [w.id, w.userId, w.balance, txRef, `ledger-${txRef}`]
      );
      count++;
    }
  } finally {
    await pool.end();
  }

  return count;
}
