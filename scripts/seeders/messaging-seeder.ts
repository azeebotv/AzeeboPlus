/**
 * Messaging Service Seeder — Azeebo+
 *
 * Populates conversation threads, participants, and messages in azeebo_messaging.
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

const CONVERSATIONS = [
  {
    id: 'conv-001',
    type: 'group',
    name: 'Reality TV Fans Lagos',
    user1: 'a0000001-0000-0000-0000-000000000006',
    user2: 'a0000001-0000-0000-0000-000000000007',
    messages: [
      { senderId: 'a0000001-0000-0000-0000-000000000006', content: 'Did you see the eviction twist yesterday?!' },
      { senderId: 'a0000001-0000-0000-0000-000000000007', content: 'Crazy twist! Nobody expected Team Green to pull that off.' },
      { senderId: 'a0000001-0000-0000-0000-000000000006', content: 'Voting for Saturday opens in 2 hours, get ready!' },
    ],
  },
  {
    id: 'conv-002',
    type: 'direct',
    name: 'Nollywood Direct',
    user1: 'a0000001-0000-0000-0000-000000000003',
    user2: 'a0000001-0000-0000-0000-000000000006',
    messages: [
      { senderId: 'a0000001-0000-0000-0000-000000000003', content: 'Thanks for tipping on the new episode premiere!' },
      { senderId: 'a0000001-0000-0000-0000-000000000006', content: 'Bro, the cinematography was 10/10. Keep it up!' },
    ],
  },
  {
    id: 'conv-003',
    type: 'group',
    name: 'AFCON 2026 Banter Room',
    user1: 'a0000001-0000-0000-0000-000000000008',
    user2: 'a0000001-0000-0000-0000-000000000011',
    messages: [
      { senderId: 'a0000001-0000-0000-0000-000000000011', content: 'Super Eagles lineup drops in 30 minutes.' },
      { senderId: 'a0000001-0000-0000-0000-000000000008', content: 'Osimhen starting upfront guaranteed goal.' },
    ],
  },
];

export async function seedMessagingService(dryRun = false): Promise<number> {
  if (dryRun) {
    console.log(`  [DRY RUN] Would seed ${CONVERSATIONS.length} conversations and 7 messages in azeebo_messaging`);
    return CONVERSATIONS.length + 7;
  }

  const pool = getPool('azeebo_messaging');
  let count = 0;

  try {
    for (const c of CONVERSATIONS) {
      // 1. Conversation
      await pool.query(
        `INSERT INTO conversations (id, type, name, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, "updatedAt" = NOW();`,
        [c.id, c.type, c.name]
      );
      count++;

      // 2. Participants
      await pool.query(
        `INSERT INTO conversation_participants (id, "conversationId", "userId", role, "joinedAt", "lastReadAt", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, 'admin', NOW(), NOW(), NOW(), NOW())
         ON CONFLICT ("conversationId", "userId") DO NOTHING;`,
        [c.id, c.user1]
      );
      count++;

      await pool.query(
        `INSERT INTO conversation_participants (id, "conversationId", "userId", role, "joinedAt", "lastReadAt", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, 'member', NOW(), NOW(), NOW(), NOW())
         ON CONFLICT ("conversationId", "userId") DO NOTHING;`,
        [c.id, c.user2]
      );
      count++;

      // 3. Messages
      for (let i = 0; i < c.messages.length; i++) {
        const m = c.messages[i];
        const msgId = `msg-${c.id}-${i + 1}`;
        await pool.query(
          `INSERT INTO messages (id, "conversationId", "senderId", content, type, "isRead", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, 'text', true, NOW() - INTERVAL '${(3 - i) * 10} minutes', NOW())
           ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, "updatedAt" = NOW();`,
          [msgId, c.id, m.senderId, m.content]
        );
        count++;
      }
    }
  } finally {
    await pool.end();
  }

  return count;
}
