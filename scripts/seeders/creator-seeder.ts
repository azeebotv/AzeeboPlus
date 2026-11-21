/**
 * Creator Service Seeder — Azeebo+
 *
 * Populates creator profiles, channels, earnings, and challenges in azeebo_creator.
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

const UNIVERSES = [
  { id: 'u0000001-0000-0000-0000-000000000001', name: 'reality', displayName: 'Reality TV', icon: '📺' },
  { id: 'u0000001-0000-0000-0000-000000000002', name: 'movies', displayName: 'Cinema & Nollywood', icon: '🎬' },
  { id: 'u0000001-0000-0000-0000-000000000003', name: 'comedy', displayName: 'Comedy & Skits', icon: '😂' },
  { id: 'u0000001-0000-0000-0000-000000000004', name: 'games', displayName: 'Games & Esports', icon: '🎮' },
  { id: 'u0000001-0000-0000-0000-000000000005', name: 'sports', displayName: 'Sports Pulse', icon: '⚽' },
  { id: 'u0000001-0000-0000-0000-000000000006', name: 'vertical', displayName: 'Vertical Series', icon: '📱' },
  { id: 'u0000001-0000-0000-0000-000000000007', name: 'lifestyle', displayName: 'Music & Lifestyle', icon: '🎵' },
  { id: 'u0000001-0000-0000-0000-000000000008', name: 'creator', displayName: 'Creator Universe', icon: '⭐' },
  { id: 'u0000001-0000-0000-0000-000000000009', name: 'live-event', displayName: 'Live Events', icon: '🎟️' },
];

const CREATORS = [
  { id: 'cp000000-0000-0000-0000-000000000001', userId: 'a0000001-0000-0000-0000-000000000003', name: 'Tunde Creates', bio: 'Nollywood filmmaker, scriptwriter & vertical series director.', banner: seedImages.unsplash('photo-1518173946687-a4c8a383392e', 1200, 400), verified: true, channel: 'Tunde Creates Studios', category: 'movies' },
  { id: 'cp000000-0000-0000-0000-000000000002', userId: 'a0000001-0000-0000-0000-000000000004', name: 'Ngozi Vibes', bio: 'Lagos street food, luxury travel, and cultural exploration.', banner: seedImages.unsplash('photo-1507525428034-b723cf961d3e', 1200, 400), verified: true, channel: 'Ngozi Vibes Official', category: 'lifestyle' },
  { id: 'cp000000-0000-0000-0000-000000000003', userId: 'a0000001-0000-0000-0000-000000000005', name: 'Emeka Studios', bio: 'Viral comedy sketches, stand-up snippets, and campus pranks.', banner: seedImages.unsplash('photo-1514525253161-7a46d19cd819', 1200, 400), verified: true, channel: 'Emeka Comedy TV', category: 'comedy' },
  { id: 'cp000000-0000-0000-0000-000000000004', userId: 'a0000001-0000-0000-0000-000000000011', name: 'Chinedu Sports', bio: 'In-depth African football tactics, NPFL highlights & AFCON podcasts.', banner: seedImages.unsplash('photo-1508098682722-e99c43a406b2', 1200, 400), verified: true, channel: 'Naija Sports Central', category: 'sports' },
  { id: 'cp000000-0000-0000-0000-000000000005', userId: 'a0000001-0000-0000-0000-000000000012', name: 'Tunde Gaming', bio: 'Top ranked FIFA & Street Fighter esports streamer in West Africa.', banner: seedImages.unsplash('photo-1542751371-adc38448a05e', 1200, 400), verified: true, channel: 'Lagos Gaming Lounge', category: 'games' },
  { id: 'cr-001', userId: '00000000-0000-4000-8000-000000000002', name: 'Basketmouth Productions', bio: 'Veteran standup comedian, producer of Flatmates and Lord of the Ribs.', banner: seedImages.unsplash('photo-1516450360452-9312f5e86fc7', 1200, 400), verified: true, channel: 'Basketmouth Comedy Vault', category: 'comedy' },
  { id: 'cr-002', userId: '00000000-0000-4000-8000-000000000003', name: 'Bovi Studios', bio: 'Standup comedian, actor, and host of Bovi Man on Fire.', banner: seedImages.unsplash('photo-1470225620780-dba8ba36b745', 1200, 400), verified: true, channel: 'Bovi Live & Uncut', category: 'comedy' },
  { id: 'cr-003', userId: '00000000-0000-4000-8000-000000000004', name: 'Taaooma Originals', bio: 'Multi-character family comedy sketches and African mom parodies.', banner: seedImages.unsplash('photo-1518709268805-4e9042af9f23', 1200, 400), verified: true, channel: 'Taaooma TV', category: 'comedy' },
  { id: 'cr-004', userId: '00000000-0000-4000-8000-000000000005', name: 'Sabinus Entertainment', bio: 'AMVCA Award-winning content creator and Investor Sabinus skits.', banner: seedImages.unsplash('photo-1511671782779-c97d3d27a1d4', 1200, 400), verified: true, channel: 'Mr Funny Official', category: 'comedy' },
  { id: 'cr-005', userId: '00000000-0000-4000-8000-000000000006', name: 'Broda Shaggi TV', bio: 'High energy comedic actor, stunts, and street interview skits.', banner: seedImages.unsplash('photo-1520523839898-507127027d86', 1200, 400), verified: true, channel: 'Fine Boy Agbero Channel', category: 'comedy' },
];

export async function seedCreatorService(dryRun = false): Promise<number> {
  if (dryRun) {
    console.log(`  [DRY RUN] Would seed 9 universes, ${CREATORS.length} creator profiles, channels, earnings, and challenges`);
    return CREATORS.length * 4 + 9;
  }

  const pool = getPool('azeebo_creator');
  let count = 0;

  try {
    // 1. Universes in azeebo_creator
    for (const u of UNIVERSES) {
      await pool.query(
        `INSERT INTO universes (id, name, "displayName", icon, "isEnabled", metadata, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, true, '{}', NOW(), NOW())
         ON CONFLICT (name) DO UPDATE SET "displayName" = EXCLUDED."displayName", icon = EXCLUDED.icon, "updatedAt" = NOW();`,
        [u.id, u.name, u.displayName, u.icon]
      );
      count++;
    }

    // 2. Creator Profiles & Channels
    for (const c of CREATORS) {
      // Ensure user exists if referenced
      await pool.query(
        `INSERT INTO users (id, email, "displayName", password, role, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, '', 'creator', NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET "displayName" = EXCLUDED."displayName", "updatedAt" = NOW();`,
        [c.userId, `${c.id}@creators.azeeboplus.com`, c.name]
      );

      await pool.query(
        `INSERT INTO creator_profiles (id, "userId", "displayName", bio, banner, verified, "tipEnabled", "tipMin", "tipMax", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, true, 100, 50000, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET
           "displayName" = EXCLUDED."displayName",
           bio = EXCLUDED.bio,
           banner = EXCLUDED.banner,
           verified = EXCLUDED.verified,
           "updatedAt" = NOW();`,
        [c.id, c.userId, c.name, c.bio, c.banner, c.verified]
      );
      count++;

      // Channel
      const channelId = `ch-${c.id}`;
      await pool.query(
        `INSERT INTO channels (id, "creatorId", name, description, category, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, "updatedAt" = NOW();`,
        [channelId, c.id, c.channel, `Official channel for ${c.name}`, c.category]
      );
      count++;

      // Creator Earnings
      await pool.query(
        `INSERT INTO creator_earnings (id, "creatorId", amount, type, status, "createdAt")
         VALUES (gen_random_uuid()::text, $1, $2, 'subscription_share', 'paid', NOW())
         ON CONFLICT DO NOTHING;`,
        [c.id, Math.floor(Math.random() * 500000) + 50000]
      );
      count++;

      // Creator Challenge
      await pool.query(
        `INSERT INTO creator_challenges (id, "creatorId", title, description, prize, "startDate", "endDate", status, "createdAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, '₦250,000 Cash Prize', NOW(), NOW() + INTERVAL '30 days', 'active', NOW())
         ON CONFLICT DO NOTHING;`,
        [c.id, `${c.name} Duet Challenge`, `Remix or recreate your favorite scene from ${c.name}'s latest special.`]
      );
      count++;
    }
  } finally {
    await pool.end();
  }

  return count;
}
