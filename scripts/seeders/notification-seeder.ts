/**
 * Notification Service Seeder — Azeebo+
 *
 * Populates templates and user notifications in azeebo_notification.
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

const TEMPLATES = [
  { key: 'welcome_user', channel: 'email', subject: 'Welcome to Azeebo+!', body: 'Welcome {{displayName}}! Dive into 9 entertainment universes curated for Africa.', variables: { displayName: 'string' } },
  { key: 'wallet_credited', channel: 'push', subject: 'Wallet Credited', body: 'Your wallet has been credited with ₦{{amount}}.', variables: { amount: 'number' } },
  { key: 'new_episode_live', channel: 'push', subject: 'New Episode Alert', body: 'A new episode of {{title}} is now streaming live.', variables: { title: 'string' } },
  { key: 'vote_reminder', channel: 'push', subject: 'Poll Closing Soon', body: 'Only 30 minutes left to cast your vote in {{pollName}}.', variables: { pollName: 'string' } },
  { key: 'creator_tipped', channel: 'push', subject: 'You Received a Tip!', body: '{{fanName}} tipped you ₦{{amount}} on {{contentTitle}}.', variables: { fanName: 'string', amount: 'number', contentTitle: 'string' } },
];

const NOTIFICATIONS = [
  { userId: 'a0000001-0000-0000-0000-000000000006', type: 'wallet', title: 'Wallet Credited', message: '₦25,000 top-up via Paystack completed successfully.' },
  { userId: 'a0000001-0000-0000-0000-000000000006', type: 'content', title: 'New Release', message: 'Lagos House Season 2 Episode 4 is now live!' },
  { userId: 'a0000001-0000-0000-0000-000000000007', type: 'reward', title: 'Badge Unlocked', message: 'You earned the "Super Voter" badge (+300 pts).' },
  { userId: 'a0000001-0000-0000-0000-000000000008', type: 'sports', title: 'Prediction Settled', message: 'Your prediction on Enyimba FC won! +300 points added.' },
  { userId: 'a0000001-0000-0000-0000-000000000003', type: 'creator', title: 'Tip Received', message: 'You received a ₦1,500 tip from Kemi Watch.' },
];

export async function seedNotificationService(dryRun = false): Promise<number> {
  if (dryRun) {
    console.log(`  [DRY RUN] Would seed ${TEMPLATES.length} templates and ${NOTIFICATIONS.length} notifications in azeebo_notification`);
    return TEMPLATES.length + NOTIFICATIONS.length;
  }

  const pool = getPool('azeebo_notification');
  let count = 0;

  try {
    // 1. Templates
    for (const t of TEMPLATES) {
      await pool.query(
        `INSERT INTO notification_templates (id, key, channel, subject, body, variables, "isActive", version, "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, true, 1, NOW(), NOW())
         ON CONFLICT (key) DO UPDATE SET
           subject = EXCLUDED.subject,
           body = EXCLUDED.body,
           variables = EXCLUDED.variables,
           "updatedAt" = NOW();`,
        [t.key, t.channel, t.subject, t.body, JSON.stringify(t.variables)]
      );
      count++;
    }

    // 2. Notifications
    for (const n of NOTIFICATIONS) {
      await pool.query(
        `INSERT INTO notifications (id, "userId", type, title, message, metadata, "createdAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, '{}', NOW())
         ON CONFLICT DO NOTHING;`,
        [n.userId, n.type, n.title, n.message]
      );
      count++;
    }
  } finally {
    await pool.end();
  }

  return count;
}
