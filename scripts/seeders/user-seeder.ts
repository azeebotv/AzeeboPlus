/**
 * User Service Seeder — Azeebo+
 *
 * Populates auth accounts in azeebo_auth and user profiles, preferences,
 * watch history, saved items, and follows in azeebo_user.
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

// Bcrypt hash for Demo123!
const DEMO_PASSWORD_HASH = '$2b$10$lLbu4m6fSQnzaCK1Frz32eoUFvToUh18TwhX7VVD9dAOCUt3HIWw.';

const CANONICAL_USERS = [
  { id: 'a0000001-0000-0000-0000-000000000001', email: 'admin@azeeboplus.com', displayName: 'Admin Chidi', role: 'admin', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', bio: 'Azeebo+ Platform Administrator', city: 'Lagos' },
  { id: 'a0000001-0000-0000-0000-000000000002', email: 'moderator@azeeboplus.com', displayName: 'Mod Amina', role: 'moderator', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', bio: 'Community Trust & Safety Lead', city: 'Abuja' },
  { id: 'a0000001-0000-0000-0000-000000000003', email: 'creator1@azeeboplus.com', displayName: 'Tunde Creates', role: 'creator', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', bio: 'Nollywood filmmaker & vertical shorts storyteller', city: 'Lagos' },
  { id: 'a0000001-0000-0000-0000-000000000004', email: 'creator2@azeeboplus.com', displayName: 'Ngozi Vibes', role: 'creator', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', bio: 'Lifestyle, Lagos food & nightlife curator', city: 'Lagos' },
  { id: 'a0000001-0000-0000-0000-000000000005', email: 'creator3@azeeboplus.com', displayName: 'Emeka Studios', role: 'creator', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150', bio: 'Comedy sketches, stand-up & parody creator', city: 'Port Harcourt' },
  { id: 'a0000001-0000-0000-0000-000000000006', email: 'user1@azeeboplus.com', displayName: 'Kemi Watch', role: 'user', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', bio: 'Binge-watching Nollywood & Reality shows 24/7', city: 'Ibadan' },
  { id: 'a0000001-0000-0000-0000-000000000007', email: 'user2@azeeboplus.com', displayName: 'Olumide F', role: 'user', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', bio: 'Afrobeats and live festival fanatic', city: 'Lagos' },
  { id: 'a0000001-0000-0000-0000-000000000008', email: 'user3@azeeboplus.com', displayName: 'Fatima A', role: 'user', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150', bio: 'Sports predictions & esports champion', city: 'Kano' },
  { id: 'a0000001-0000-0000-0000-000000000009', email: 'banned@azeeboplus.com', displayName: 'Chukwu M', role: 'user', avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150', bio: 'Test suspended account', city: 'Enugu' },
  { id: 'a0000001-0000-0000-0000-000000000010', email: 'unverified@azeeboplus.com', displayName: 'Yemi O', role: 'user', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', bio: 'Fresh sign up test user', city: 'Benin City' },
  { id: 'a0000001-0000-0000-0000-000000000011', email: 'sportscreator@azeeboplus.com', displayName: 'Chinedu Sports', role: 'creator', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', bio: 'NPFL & African football analyst', city: 'Owerri' },
  { id: 'a0000001-0000-0000-0000-000000000012', email: 'gamer@azeeboplus.com', displayName: 'Tunde Gaming', role: 'creator', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', bio: 'FIFA & Street Fighter esports streamer', city: 'Lagos' },
];

export async function seedUserService(dryRun = false): Promise<number> {
  if (dryRun) {
    console.log(`  [DRY RUN] Would seed ${CANONICAL_USERS.length} canonical users across azeebo_auth and azeebo_user`);
    return CANONICAL_USERS.length * 4;
  }

  const authPool = getPool('azeebo_auth');
  const userPool = getPool('azeebo_user');
  let count = 0;

  try {
    for (const u of CANONICAL_USERS) {
      // 1. azeebo_auth.users
      await authPool.query(
        `INSERT INTO users (id, email, password, "displayName", avatar, role, "isVerified", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6::"UserRole", true, NOW(), NOW())
         ON CONFLICT (email) DO UPDATE SET
           password = EXCLUDED.password,
           "displayName" = EXCLUDED."displayName",
           avatar = EXCLUDED.avatar,
           role = EXCLUDED.role,
           "isVerified" = true,
           "updatedAt" = NOW();`,
        [u.id, u.email, DEMO_PASSWORD_HASH, u.displayName, u.avatar, u.role]
      );
      count++;

      // 2. azeebo_user.users
      await userPool.query(
        `INSERT INTO users (id, email, "displayName", avatar, role, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET
           email = EXCLUDED.email,
           "displayName" = EXCLUDED."displayName",
           avatar = EXCLUDED.avatar,
           role = EXCLUDED.role,
           "updatedAt" = NOW();`,
        [u.id, u.email, u.displayName, u.avatar, u.role]
      );
      count++;

      // 3. azeebo_user.user_profiles
      await userPool.query(
        `INSERT INTO user_profiles (id, "userId", "displayName", avatar, bio, location, "isPublic", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, true, NOW(), NOW())
         ON CONFLICT ("userId") DO UPDATE SET
           "displayName" = EXCLUDED."displayName",
           avatar = EXCLUDED.avatar,
           bio = EXCLUDED.bio,
           location = EXCLUDED.location,
           "updatedAt" = NOW();`,
        [u.id, u.displayName, u.avatar, u.bio, u.city]
      );
      count++;

      // 4. azeebo_user.user_preferences
      await userPool.query(
        `INSERT INTO user_preferences (id, "userId", "darkMode", notifications, "contentPreferences", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, true, '{"push": true, "email": true, "sms": false}', '["reality", "movies", "comedy", "sports"]', NOW(), NOW())
         ON CONFLICT ("userId") DO UPDATE SET
           "darkMode" = EXCLUDED."darkMode",
           "updatedAt" = NOW();`,
        [u.id]
      );
      count++;
    }

    // 5. Watch history for first 5 users
    const sampleContent = [
      { id: 'cnt-reality-001', title: 'Lagos House', universe: 'reality' },
      { id: 'cnt-movies-001', title: 'The Wedding Party 3', universe: 'movies' },
      { id: 'cnt-comedy-001', title: 'Senior Advocate of Skits', universe: 'comedy' },
      { id: 'cnt-sports-001', title: 'NPFL Matchday Live', universe: 'sports' },
    ];

    for (let i = 0; i < 5; i++) {
      const user = CANONICAL_USERS[i];
      for (const c of sampleContent) {
        await userPool.query(
          `INSERT INTO watch_history (id, "userId", "contentId", "contentType", universe, "watchedAt", "createdAt", "updatedAt")
           VALUES (gen_random_uuid()::text, $1, $2, 'video', $3, NOW(), NOW(), NOW())
           ON CONFLICT ("userId", "contentId") DO UPDATE SET
             "watchedAt" = NOW(),
             "updatedAt" = NOW();`,
          [user.id, c.id, c.universe]
        );
        count++;

        // Saved items
        await userPool.query(
          `INSERT INTO saved_items (id, "userId", "contentId", "createdAt", "updatedAt")
           VALUES (gen_random_uuid()::text, $1, $2, NOW(), NOW())
           ON CONFLICT ("userId", "contentId") DO UPDATE SET "updatedAt" = NOW();`,
          [user.id, c.id]
        );
        count++;
      }
    }

    // 6. Following relationships among canonical creators & users
    for (let i = 5; i < 9; i++) {
      const follower = CANONICAL_USERS[i];
      for (let j = 2; j < 5; j++) {
        const creator = CANONICAL_USERS[j];
        await userPool.query(
          `INSERT INTO following (id, "followerId", "followingId", "createdAt", "updatedAt")
           VALUES (gen_random_uuid()::text, $1, $2, NOW(), NOW())
           ON CONFLICT ("followerId", "followingId") DO NOTHING;`,
          [follower.id, creator.id]
        );
        count++;
      }
    }
  } finally {
    await authPool.end();
    await userPool.end();
  }

  return count;
}
