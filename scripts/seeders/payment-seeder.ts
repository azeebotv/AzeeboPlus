/**
 * Payment Service Seeder — Azeebo+
 *
 * Populates payment methods, intents, and completed transactions in azeebo_payment.
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

const PAYMENT_USERS = [
  { userId: 'a0000001-0000-0000-0000-000000000006', brand: 'visa', last4: '4242', token: 'tok_visa_4242' },
  { userId: 'a0000001-0000-0000-0000-000000000007', brand: 'mastercard', last4: '5555', token: 'tok_mc_5555' },
  { userId: 'a0000001-0000-0000-0000-000000000008', brand: 'verve', last4: '1234', token: 'tok_verve_1234' },
  { userId: 'a0000001-0000-0000-0000-000000000003', brand: 'visa', last4: '8888', token: 'tok_visa_8888' },
  { userId: 'a0000001-0000-0000-0000-000000000004', brand: 'mastercard', last4: '4321', token: 'tok_mc_4321' },
];

export async function seedPaymentService(dryRun = false): Promise<number> {
  if (dryRun) {
    console.log(`  [DRY RUN] Would seed ${PAYMENT_USERS.length} payment methods and 15 transactions in azeebo_payment`);
    return PAYMENT_USERS.length + 15;
  }

  const pool = getPool('azeebo_payment');
  let count = 0;

  try {
    // 1. Payment Methods
    for (const p of PAYMENT_USERS) {
      await pool.query(
        `INSERT INTO payment_methods (id, "userId", provider, "providerToken", type, brand, last4, "expiryMonth", "expiryYear", "isDefault", "isActive", metadata, "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, 'paystack', $2, 'card', $3, $4, 12, 2028, true, true, '{}', NOW(), NOW())
         ON CONFLICT ("userId", provider, "providerToken") DO UPDATE SET "updatedAt" = NOW();`,
        [p.userId, p.token, p.brand, p.last4]
      );
      count++;
    }

    // 2. Payments / Transactions
    const samplePayments = [
      { userId: 'a0000001-0000-0000-0000-000000000006', amount: 3500, type: 'subscription', ref: 'pay_sub_001', status: 'completed' },
      { userId: 'a0000001-0000-0000-0000-000000000007', amount: 5000, type: 'top_up', ref: 'pay_top_002', status: 'completed' },
      { userId: 'a0000001-0000-0000-0000-000000000008', amount: 1500, type: 'tip', ref: 'pay_tip_003', status: 'completed' },
      { userId: 'a0000001-0000-0000-0000-000000000006', amount: 2500, type: 'ppv_pass', ref: 'pay_ppv_004', status: 'completed' },
      { userId: 'a0000001-0000-0000-0000-000000000007', amount: 7500, type: 'subscription', ref: 'pay_sub_005', status: 'completed' },
      { userId: 'a0000001-0000-0000-0000-000000000003', amount: 10000, type: 'top_up', ref: 'pay_top_006', status: 'completed' },
    ];

    for (const sp of samplePayments) {
      await pool.query(
        `INSERT INTO payments (id, "userId", amount, currency, status, type, provider, "providerRef", "completedAt", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, 'NGN', $3, $4, 'paystack', $5, NOW(), NOW(), NOW())
         ON CONFLICT (provider, "providerRef") DO UPDATE SET status = EXCLUDED.status, "updatedAt" = NOW();`,
        [sp.userId, sp.amount, sp.status, sp.type, sp.ref]
      );
      count++;
    }
  } finally {
    await pool.end();
  }

  return count;
}
