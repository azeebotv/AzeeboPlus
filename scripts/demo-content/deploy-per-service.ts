#!/usr/bin/env tsx
// =============================================================================
// Azeebo+ Per-Service Database Seeder
// Seeds demo data into each microservice's dedicated PostgreSQL database.
// Run: npx tsx scripts/demo-content/deploy-per-service.ts
// =============================================================================

import { Client } from 'pg';

const HOST = 'localhost';
const PORT = 5432;
const USER = 'postgres';

function connStr(dbName: string): string {
  return `postgresql://${USER}@${HOST}:${PORT}/${dbName}`;
}

async function getExistingTables(client: Client): Promise<Set<string>> {
  const res = await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`,
  );
  return new Set(res.rows.map((r: Record<string, string>) => r.table_name));
}

async function ins(
  client: Client,
  table: string,
  columns: string[],
  rows: unknown[][],
  onConflict = 'DO NOTHING',
): Promise<number> {
  if (rows.length === 0) return 0;
  const colList = columns.map((c) => `"${c}"`).join(', ');
  const valPH = rows
    .map((row, i) => {
      const phs = row.map((_, j) => `$${i * columns.length + j + 1}`).join(', ');
      return `(${phs})`;
    })
    .join(', ');
  const sql = `INSERT INTO "${table}" (${colList}) VALUES ${valPH} ON CONFLICT ${onConflict}`;
  await client.query(sql, rows.flat());
  return rows.length;
}

const PW = '$2b$10$lLbu4m6fSQnzaCK1Frz32eoUFvToUh18TwhX7VVD9dAOCUt3HIWw.';

function userRows(): unknown[][] {
  return [
    ['a0000001-0000-0000-0000-000000000001','admin@azeeboplus.com',PW,'Admin Chidi','https://ui-avatars.com/api/?name=Chidi+Okonkwo&background=1B5E20&color=fff','admin',true,'2025-01-01T00:00:00Z'],
    ['a0000001-0000-0000-0000-000000000002','moderator@azeeboplus.com',PW,'Mod Amina','https://ui-avatars.com/api/?name=Amina+Bello&background=E65100&color=fff','moderator',true,'2025-01-15T00:00:00Z'],
    ['a0000001-0000-0000-0000-000000000003','creator1@azeeboplus.com',PW,'Tunde Creates','https://ui-avatars.com/api/?name=Tunde+Adebayo&background=1565C0&color=fff','user',true,'2025-02-01T00:00:00Z'],
    ['a0000001-0000-0000-0000-000000000004','creator2@azeeboplus.com',PW,'Ngozi Vibes','https://ui-avatars.com/api/?name=Ngozi+Eze&background=6A1B9A&color=fff','user',true,'2025-02-15T00:00:00Z'],
    ['a0000001-0000-0000-0000-000000000005','creator3@azeeboplus.com',PW,'Emeka Studios','https://ui-avatars.com/api/?name=Emeka+Nwosu&background=B71C1C&color=fff','user',true,'2025-03-01T00:00:00Z'],
    ['a0000001-0000-0000-0000-000000000006','user1@azeeboplus.com',PW,'Kemi Watch','https://ui-avatars.com/api/?name=Kemi+Adesanya&background=00695C&color=fff','user',true,'2025-03-15T00:00:00Z'],
    ['a0000001-0000-0000-0000-000000000007','user2@azeeboplus.com',PW,'Olumide F','https://ui-avatars.com/api/?name=Olumide+Fashola&background=4E342E&color=fff','user',true,'2025-04-01T00:00:00Z'],
    ['a0000001-0000-0000-0000-000000000008','user3@azeeboplus.com',PW,'Fatima A','https://ui-avatars.com/api/?name=Fatima+Abubakar&background=0277BD&color=fff','user',true,'2025-04-15T00:00:00Z'],
    ['a0000001-0000-0000-0000-000000000009','banned@azeeboplus.com',PW,'Chukwu M',null,'user',true,'2025-02-20T00:00:00Z'],
    ['a0000001-0000-0000-0000-000000000010','unverified@azeeboplus.com',PW,'Yemi O',null,'user',false,'2025-05-01T00:00:00Z'],
    ['a0000001-0000-0000-0000-000000000011','sportscreator@azeeboplus.com',PW,'Chinedu Sports','https://ui-avatars.com/api/?name=Chinedu+Obi&background=E65100&color=fff','user',true,'2025-03-10T00:00:00Z'],
    ['a0000001-0000-0000-0000-000000000012','gamer@azeeboplus.com',PW,'Tunde Gaming','https://ui-avatars.com/api/?name=Tunde+Olatunji&background=1A237E&color=fff','user',true,'2025-04-01T00:00:00Z'],
  ];
}

function userCols(): string[] {
  return ['id','email','password','displayName','avatar','role','isVerified','createdAt'];
}

const UNIV = {
  reality: 'u0000001-0000-0000-0000-000000000001',
  creator: 'u0000001-0000-0000-0000-000000000002',
  lifestyle: 'u0000001-0000-0000-0000-000000000003',
  movies: 'u0000001-0000-0000-0000-000000000004',
  comedy: 'u0000001-0000-0000-0000-000000000005',
  sports: 'u0000001-0000-0000-0000-000000000006',
  music: 'u0000001-0000-0000-0000-000000000007',
  games: 'u0000001-0000-0000-0000-000000000008',
  vertical: 'u0000001-0000-0000-0000-000000000009',
};

const CR = {
  tunde: 'a0000001-0000-0000-0000-000000000003',
  ngozi: 'a0000001-0000-0000-0000-000000000004',
  emeka: 'a0000001-0000-0000-0000-000000000005',
  sports: 'a0000001-0000-0000-0000-000000000011',
  gamer: 'a0000001-0000-0000-0000-000000000012',
};

async function main(): Promise<void> {
  const dbs = [
    'azeebo_auth', 'azeebo_content', 'azeebo_wallet', 'azeebo_user',
    'azeebo_creator', 'azeebo_engagement', 'azeebo_notification',
    'azeebo_moderation', 'azeebo_support', 'azeebo_search',
    'azeebo_recommendation', 'azeebo_referral', 'azeebo_reality',
    'azeebo_games', 'azeebo_comedy', 'azeebo_sports', 'azeebo_lifestyle',
    'azeebo_vertical', 'azeebo_media',
  ];
  console.log('Azeebo+ Per-Service Database Seeder');
  console.log('========================================');

  for (const dbName of dbs) {
    const client = new Client({ connectionString: connStr(dbName) });
    try { await client.connect(); } catch {
      console.log(`\n  [SKIP] ${dbName} - connection failed`);
      continue;
    }
    const tables = await getExistingTables(client);
    let total = 0;
    console.log(`\n>> ${dbName} (tables: ${tables.size})`);

    // =========================================================================
    // azeebo_auth
    // =========================================================================
    if (dbName === 'azeebo_auth') {
      if (tables.has('users')) {
        const n = await ins(client, 'users', userCols(), userRows(),
          '("id") DO UPDATE SET email = EXCLUDED.email, "displayName" = EXCLUDED."displayName"');
        console.log(`  users: ${n}`); total += n;
      }
      if (tables.has('user_roles')) {
        const n = await ins(client, 'user_roles', ['id','userId','role','grantedBy','createdAt'], [
          ['b0000001-0000-0000-0000-000000000001','a0000001-0000-0000-0000-000000000001','admin','system','2025-01-01T00:00:00Z'],
          ['b0000001-0000-0000-0000-000000000002','a0000001-0000-0000-0000-000000000002','moderator','a0000001-0000-0000-0000-000000000001','2025-01-15T00:00:00Z'],
          ['b0000001-0000-0000-0000-000000000003','a0000001-0000-0000-0000-000000000003','creator','a0000001-0000-0000-0000-000000000001','2025-02-01T00:00:00Z'],
          ['b0000001-0000-0000-0000-000000000004','a0000001-0000-0000-0000-000000000004','creator','a0000001-0000-0000-0000-000000000001','2025-02-15T00:00:00Z'],
          ['b0000001-0000-0000-0000-000000000005','a0000001-0000-0000-0000-000000000005','creator','a0000001-0000-0000-0000-000000000001','2025-03-01T00:00:00Z'],
          ['b0000001-0000-0000-0000-000000000011','a0000001-0000-0000-0000-000000000011','creator','a0000001-0000-0000-0000-000000000001','2025-03-10T00:00:00Z'],
          ['b0000001-0000-0000-0000-000000000012','a0000001-0000-0000-0000-000000000012','creator','a0000001-0000-0000-0000-000000000001','2025-04-01T00:00:00Z'],
        ]);
        console.log(`  user_roles: ${n}`); total += n;
      }
      if (tables.has('roles')) {
        const n = await ins(client, 'roles', ['id','name','description'], [
          ['rl00001-0000-0000-0000-000000000001','admin','Platform administrator'],
          ['rl00001-0000-0000-0000-000000000002','moderator','Content moderator'],
          ['rl00001-0000-0000-0000-000000000003','creator','Content creator'],
          ['rl00001-0000-0000-0000-000000000004','user','Regular user'],
        ]);
        console.log(`  roles: ${n}`); total += n;
      }
      if (tables.has('permissions')) {
        const n = await ins(client, 'permissions', ['id','name','description','resource','action'], [
          ['pm00001-0000-0000-0000-000000000001','manage_users','Manage all users','users','manage'],
          ['pm00001-0000-0000-0000-000000000002','moderate_content','Moderate content','content','moderate'],
          ['pm00001-0000-0000-0000-000000000003','create_content','Create content','content','create'],
          ['pm00001-0000-0000-0000-000000000004','view_premium','View premium content','content','view'],
        ]);
        console.log(`  permissions: ${n}`); total += n;
      }
      if (tables.has('role_permissions')) {
        const n = await ins(client, 'role_permissions', ['id','roleId','permissionId'], [
          ['rp00001-0000-0000-0000-000000000001','rl00001-0000-0000-0000-000000000001','pm00001-0000-0000-0000-000000000001'],
          ['rp00001-0000-0000-0000-000000000002','rl00001-0000-0000-0000-000000000001','pm00001-0000-0000-0000-000000000002'],
          ['rp00001-0000-0000-0000-000000000003','rl00001-0000-0000-0000-000000000002','pm00001-0000-0000-0000-000000000002'],
          ['rp00001-0000-0000-0000-000000000004','rl00001-0000-0000-0000-000000000003','pm00001-0000-0000-0000-000000000003'],
          ['rp00001-0000-0000-0000-000000000005','rl00001-0000-0000-0000-000000000004','pm00001-0000-0000-0000-000000000004'],
        ]);
        console.log(`  role_permissions: ${n}`); total += n;
      }
    }

    // =========================================================================
    // azeebo_content
    // =========================================================================
    if (dbName === 'azeebo_content') {
      if (tables.has('users')) {
        const n = await ins(client, 'users', ['id','email','displayName'], [
          ['sys00001-0000-0000-0000-000000000001','system@azeeboplus.com','System'],
          ['a0000001-0000-0000-0000-000000000003','creator1@azeeboplus.com','Tunde Creates'],
          ['a0000001-0000-0000-0000-000000000004','creator2@azeeboplus.com','Ngozi Vibes'],
          ['a0000001-0000-0000-0000-000000000005','creator3@azeeboplus.com','Emeka Studios'],
        ], '("id") DO NOTHING');
        console.log(`  users (FK): ${n}`); total += n;
      }
      if (tables.has('system_settings')) {
        const n = await ins(client, 'system_settings', ['key','value','category','description','isPublic'], [
          ['site_name','"Azeebo+"','general','Platform name',true],
          ['site_description','"Nigeria\'s premier entertainment streaming platform"','general','Platform tagline',true],
          ['maintenance_mode','false','general','Maintenance mode toggle',false],
          ['registration_enabled','true','auth','Allow new registrations',false],
          ['max_upload_size_mb','500','uploads','Maximum file upload size in MB',false],
          ['default_currency','"NGN"','payments','Default transaction currency',true],
          ['currency_symbol','"₦"','payments','Currency display symbol',true],
          ['min_rental_price','200','payments','Minimum rental price in NGN',false],
          ['max_rental_price','50000','payments','Maximum rental price in NGN',false],
          ['featured_content_limit','6','content','Max featured items on homepage',true],
          ['trending_window_hours','168','content','Hours to consider for trending calc',false],
          ['comment_max_length','2000','content','Max comment character length',false],
          ['screening_max_viewers','10000','screenings','Default max viewers per screening',false],
          ['otp_expiry_minutes','10','auth','OTP code expiration in minutes',false],
          ['social_google_enabled','true','social','Google OAuth login enabled',true],
          ['social_apple_enabled','true','social','Apple Sign-In enabled',true],
          ['seo_title','"Azeebo+ - Stream Nigerian Entertainment"','seo','Default SEO title',true],
          ['seo_description','"Watch reality shows, creator content, lifestyle, movies and more on Azeebo+"','seo','Default SEO description',true],
          ['support_email','"support@azeeboplus.com"','contact','Support email address',true],
          ['terms_url','"https://azeeboplus.com/terms"','legal','Terms of service URL',true],
        ], '("key") DO NOTHING');
        console.log(`  system_settings: ${n}`); total += n;
      }
      if (tables.has('universes')) {
        const n = await ins(client, 'universes', ['id','name','displayName','description','icon','color','isEnabled','sortOrder'], [
          ['u0000001-0000-0000-0000-000000000001','reality','Reality TV','Nigerian reality shows including Big Brother, dating shows, and competition series.','🎬','#E91E63',true,1],
          ['u0000001-0000-0000-0000-000000000002','creator','Creator Content','Original content from top Nigerian creators, vlogs, and independent productions.','🎨','#9C27B0',true,2],
          ['u0000001-0000-0000-0000-000000000003','lifestyle','Lifestyle','Fashion, food, travel, wellness, and everyday Nigerian living.','🏠','#FF9800',true,3],
          ['u0000001-0000-0000-0000-000000000004','movie','Movies','Nollywood blockbusters, indie films, and cinematic masterpieces.','🎥','#2196F3',true,4],
          ['u0000001-0000-0000-0000-000000000005','comedy','Comedy','Stand-up specials, comedy sketches, and hilarious Naija content.','😂','#FFEB3B',true,5],
          ['u0000001-0000-0000-0000-000000000006','sports','Sports','Football highlights, basketball, athletics, and sports commentary.','⚽','#4CAF50',true,6],
          ['u0000001-0000-0000-0000-000000000007','music','Music','Music videos, concert recordings, acoustic sessions, and behind-the-scenes.','🎵','#FF5722',true,7],
          ['u0000001-0000-0000-0000-000000000008','games','Gaming','Nigerian gaming content, esports, reviews, and live streams.','🎮','#607D8B',true,8],
          ['u0000001-0000-0000-0000-000000000009','vertical','Vertical Series','Premium African storytelling with interconnected characters and lore.','📖','#8B5CF6',true,9],
        ]);
        console.log(`  universes: ${n}`); total += n;
      }
      if (tables.has('categories')) {
        const n = await ins(client, 'categories', ['id','name','slug','description','icon','color'], [
          ['cat00001-0000-0000-0000-000000000001','Trending Now','trending-now','Currently popular content','🔥','#F44336'],
          ['cat00001-0000-0000-0000-000000000002','New Releases','new-releases','Freshly published content','✨','#FF9800'],
          ['cat00001-0000-0000-0000-000000000003','Editor Picks','editor-picks','Handpicked by our editorial team','⭐','#FFD700'],
          ['cat00001-0000-0000-0000-000000000004','Exclusive','exclusive','Only on Azeebo+','👑','#9C27B0'],
          ['cat00001-0000-0000-0000-000000000005','Free Content','free-content','Watch for free','🆓','#4CAF50'],
          ['cat00001-0000-0000-0000-000000000006','Live Events','live-events','Upcoming and live screenings','📡','#E91E63'],
          ['cat00001-0000-0000-0000-000000000007','Nollywood Classics','nollywood-classics','Timeless Nigerian cinema classics','🎞️','#795548'],
          ['cat00001-0000-0000-0000-000000000008','Documentaries','documentaries','Real stories, real impact','📽️','#607D8B'],
        ]);
        console.log(`  categories: ${n}`); total += n;
      }
      if (tables.has('tags')) {
        const n = await ins(client, 'tags', ['id','name','description'], [
          ['tag00001-0000-0000-0000-000000000001','naija','Nigerian content'],
          ['tag00001-0000-0000-0000-000000000002','big-brother','Big Brother related'],
          ['tag00001-0000-0000-0000-000000000003','nollywood','Nigerian cinema'],
          ['tag00001-0000-0000-0000-000000000004','afrobeats','Afrobeats music'],
          ['tag00001-0000-0000-0000-000000000005','comedy','Funny content'],
          ['tag00001-0000-0000-0000-000000000006','fashion','Fashion and style'],
          ['tag00001-0000-0000-0000-000000000007','food','Food and cooking'],
          ['tag00001-0000-0000-0000-000000000008','football','Football content'],
          ['tag00001-0000-0000-0000-000000000009','reality-show','Reality show content'],
          ['tag00001-0000-0000-0000-000000000010','premiere','Premiere releases'],
          ['tag00001-0000-0000-0000-000000000011','behind-the-scenes','BTS content'],
          ['tag00001-0000-0000-0000-000000000012','exclusive','Exclusive content'],
          ['tag00001-0000-0000-0000-000000000013','documentary','Documentary content'],
          ['tag00001-0000-0000-0000-000000000014','gaming','Gaming content'],
          ['tag00001-0000-0000-0000-000000000015','live','Live content'],
        ]);
        console.log(`  tags: ${n}`); total += n;
      }
    }

    await client.end();
    console.log(`  -> Total seeded for ${dbName}: ${total}`);
  }

  console.log('\nSeeding completed.');
}

main().catch((err) => {
  console.error('Fatal error during seeding:', err);
  process.exit(1);
});
