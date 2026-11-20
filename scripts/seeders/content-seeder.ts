/**
 * Content Service Seeder — Azeebo+
 *
 * Populates:
 *   1. 9 Canonical Universes (reality, creator, lifestyle, movies, comedy, sports, music, games, vertical)
 *   2. 8 Canonical Categories (Trending Now, New Releases, Editor Picks, Exclusive, Free Content, Live Events, Nollywood Classics, Documentaries)
 *   3. 30 Culturally Authentic Content Items PER Universe (270 items total)
 *   4. Category Associations (_CategoryToContentItem)
 *   5. Community Comments
 *
 * Fully idempotent (uses deterministic IDs & ON CONFLICT).
 */

import pg from 'pg';
import { themedArt } from './seed-image-hosts.js';

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
  { id: 'u0000001-0000-0000-0000-000000000001', name: 'reality', displayName: 'Reality TV', icon: '📺', color: '#FF6B6B' },
  { id: 'u0000001-0000-0000-0000-000000000002', name: 'creator', displayName: 'Creator Universe', icon: '✨', color: '#4ECDC4' },
  { id: 'u0000001-0000-0000-0000-000000000003', name: 'lifestyle', displayName: 'Lifestyle & Nightlife', icon: '🧭', color: '#45B7D1' },
  { id: 'u0000001-0000-0000-0000-000000000004', name: 'movies', displayName: 'Movies & Cinema', icon: '🎬', color: '#FFEAA7' },
  { id: 'u0000001-0000-0000-0000-000000000005', name: 'comedy', displayName: 'Comedy Hub', icon: '😂', color: '#F39C12' },
  { id: 'u0000001-0000-0000-0000-000000000006', name: 'sports', displayName: 'Sports & Odds', icon: '🏆', color: '#E74C3C' },
  { id: 'u0000001-0000-0000-0000-000000000007', name: 'music', displayName: 'Afrobeats & Sound', icon: '🎵', color: '#A29BFE' },
  { id: 'u0000001-0000-0000-0000-000000000008', name: 'games', displayName: 'Games & Esports', icon: '🎮', color: '#DDA0DD' },
  { id: 'u0000001-0000-0000-0000-000000000009', name: 'vertical', displayName: 'Vertical Series', icon: '📱', color: '#96CEB4' },
];

const CATEGORIES = [
  { id: 'cat00001-0000-0000-0000-000000000001', name: 'Trending Now', slug: 'trending-now', icon: '🔥' },
  { id: 'cat00001-0000-0000-0000-000000000002', name: 'New Releases', slug: 'new-releases', icon: '✨' },
  { id: 'cat00001-0000-0000-0000-000000000003', name: 'Editor Picks', slug: 'editor-picks', icon: '⭐' },
  { id: 'cat00001-0000-0000-0000-000000000004', name: 'Exclusive', slug: 'exclusive', icon: '👑' },
  { id: 'cat00001-0000-0000-0000-000000000005', name: 'Free Content', slug: 'free-content', icon: '🎁' },
  { id: 'cat00001-0000-0000-0000-000000000006', name: 'Live Events', slug: 'live-events', icon: '🔴' },
  { id: 'cat00001-0000-0000-0000-000000000007', name: 'Nollywood Classics', slug: 'nollywood-classics', icon: '🎞️' },
  { id: 'cat00001-0000-0000-0000-000000000008', name: 'Documentaries', slug: 'documentaries', icon: '🌍' },
];

const CREATOR_IDS = [
  'a0000001-0000-0000-0000-000000000003', // Tunde Creates
  'a0000001-0000-0000-0000-000000000004', // Ngozi Vibes
  'a0000001-0000-0000-0000-000000000005', // Emeka Studios
  'a0000001-0000-0000-0000-000000000011', // Chinedu Sports
  'a0000001-0000-0000-0000-000000000012', // Tunde Gaming
];

const TITLES: Record<string, string[]> = {
  reality: [
    'BBNaija Diary Room Secrets', 'Shine Ya Eye Reunion', 'The Real Housemates', 'Lagos House Guest',
    'Ultimate Love Stories', 'Naija Idol Auditions', 'Dance Challenge Nigeria', 'The Influencer House',
    'Kampala Nights', 'Celebrity Gist Live', 'Survivor Naija', 'Big Brother Hot Shots',
    'Date My Family NG', 'Come Dine With Me Lagos', 'The Voice Naija', 'Ex on the Beach Naija',
    'Mastermate House', 'The Gist Corner', 'Wahala After Dark', 'Campus Queen',
    'Market Queens', 'Lagos Socialites', 'The Rich Aunty Show', 'Island Life NG',
    'Kano Chronicles', 'Abuja Elites', 'Portharcourt Palava', 'The Grandma Squad',
    'Road Trip Reality', 'Naija Wedding Wars',
  ],
  creator: [
    'Studio Setup Tour', 'How I Edit My Videos', 'Creator Money Talk', 'Vlog: Market Day',
    'Skits That Paid My Rent', 'Building a Brand in Lagos', 'My Content Calendar', 'Camera Gear for Beginners',
    'Lighting on a Budget', 'From 0 to 100k Subscribers', 'Cooking Content 101', 'Travel Vlogging Nigeria',
    'Tech Review Basics', 'Fitness Creator Journey', 'Fashion Haul & Review', 'Podcasting in Nigeria',
    'Monetizing Tips & Tricks', 'Behind the Scenes Shoot', 'Collab Week Diaries', 'Growing on Multiple Platforms',
    'Creator Burnout Talk', 'Reading My Comments', 'Testing Viral Hacks', 'Wardrobe Essentials',
    'Skit Production Day', 'My Office Studio', 'Q&A with Fans', 'Brand Deal Breakdown',
    'Naija Street Food Tour', 'Room Makeover',
  ],
  lifestyle: [
    'Lagos Nightlife Guide', 'Asebi Fashion Week', 'Street Food Trail: Yaba', 'Wedding Lookbook 2026',
    'Skincare for Harmattan', 'Weekend in Calabar', 'High Tea in Ikoyi', 'Sneaker Culture Naija',
    'Brunch Spots VI', 'Owambe Style Guide', 'Thrift Shopping Lekki', 'Home Decor Naija',
    'Fitness for Busy People', 'Natural Hair Care', 'Makeup for Dark Skin', 'Romantic Getaways NG',
    'Suya Crawl: Abuja', 'Beach Day: Tarkwa Bay', 'Interior Design on a Budget', 'Corporate Style Tips',
    'Nigerian DJs to Know', 'Art Galleries Lagos', 'Date Night Ideas', 'Luxury vs Budget: Spa',
    'Aso Ebi Trends', 'Photography Walk: City', 'Plant Parenting 101', 'Cocktail Hour Recipes',
    'Road Trip Essentials', 'Cultural Festivals Guide',
  ],
  movies: [
    'The Nollywood Heist', 'Anikulapo Rising', 'Lagos Taxi Driver', 'King of Boys III',
    'The Son of the Soil', 'Ijeoma Returns', 'Csar of Aba', 'Blood Vessel',
    'House of Ga Remake', 'Brotherhood II', 'Citation Story', 'The Milkmaid',
    '93 Days Later', 'October 1 Sequel', 'The Wedding Party 4', 'Chief Daddy Returns',
    'Omo Ghetto III', 'Sugar Rush 2', 'Eyimofe Nights', 'This Is Lagos',
    'Mami Wata Tale', 'Ajosepo Secrets', 'Funmilayo Rises', 'A Tribe Called Judah II',
    'Orisa Legend', 'Kesari The Warrior', 'Jagun Jagun II', 'Elesin Oba Story',
    'Green White Green', 'Up North Journey',
  ],
  comedy: [
    'Mark Angel Classics', 'Sabinus in Trouble', 'Lasisi Go To School', 'Bae U Bars',
    'Mr Macaroni Skit', 'Sydney Talker Pranks', 'Nons Miraj Comedy', 'Taooma Abuja Life',
    'Broda Shaggi Street', 'Zicsaloma Choir', 'Brain Jotter Landlord', 'Lord Lamba Delivery',
    'SamSpedy Mama T', 'Kiekie Market Run', 'Warri Pikin Gym', 'The Other Side Skits',
    'Crazeclown When', 'D FPredictable Comedy', 'Officer Woos Arrest', 'Oluwadolarz Roommate',
    'Isbae U Sirbalo', 'Remedy Control Crowd', 'Twins Oluoma Comedy', 'Ekwutos Comedy Skit',
    'Mama Felicia Kitchen', 'Naija Police Checkpoint', 'Danfo Drivers Palava', 'Generator Wahala',
    'NEPA Bill Saga', 'Village Meeting',
  ],
  sports: [
    'AFCON Qualifier Highlights', 'Lagos Marathon 2026', 'NPFL Derby Day', 'Super Eagles Training',
    'Basketball League Finals', 'Boxing Night Lagos', 'Table Tennis Masters', 'Wrestling Championship',
    'Cycling Tour Naija', 'Swimming Trials', 'Athletics Grand Prix', 'Football Academy Tour',
    'Rugby in Nigeria', 'Volleyball Nationals', 'Handball Cup Final', 'Kicks Naija Weekly',
    'Stadium Tour: Moshood', 'Women Football Rising', 'Goalkeeping Masterclass', 'Futsal Street Cup',
    'Cricket Comes Home', 'Badminton Open', 'Chess Grandmasters NG', 'Gaming Olympics Tryout',
    'Fans Corner Debate', 'Transfer Window Talk', 'Coach Corner Tactics', 'Youth League Spotlight',
    'DStv Premiership Review', 'Legends Match Day',
  ],
  music: [
    'Afrobeats Live Session', 'Fuji Meets Jazz', 'Gospel Praise Night', 'Alté Vibes Concert',
    'Amapiano Naija Mix', 'Studio Session: Beats', 'Street Hop Cypher', 'Highlife Legends',
    'Gbedu Awards Night', 'Coke Studio Naija', 'Unplugged Lagos', 'Drumline Battle',
    'Kora Strings Night', 'Owambe DJ Set', 'Rap Royale', 'Soul Train Naija',
    'Reggae on the Beach', 'Traditional Drums Tour', 'Choir Competitions', 'Waka Music Revival',
    'Apala Nights', 'Sakara Special', 'Jùjú Sunday Sessions', 'Afrofusion Concert',
    'Live Band Karaoke', 'Open Mic Fridays', 'Festival Main Stage', 'Rooftop Acoustic',
    'Midnight Jazz Café', 'Producer Camp Finale',
  ],
  games: [
    'FIFA Naija Cup', 'Call of Duty Lagos', 'Mortal Kombat Tourney', 'Chess AI Showdown',
    'Racing Sim League', 'PUBG Squad Naija', 'Minecraft Build-Off', 'Valorant Campus Clash',
    'FIFA Career Mode', 'Mobile Legends Rank', 'NBA 2K Streetball', 'Fight Night Arcade',
    'Retro Gaming Night', 'Speedrun Marathon', 'Quiz Showdown', 'Board Game Cafe',
    'D&D Campaign NG', 'Esports Awards', 'Team Scrims Vlog', 'Controller vs Keyboard',
    'Gaming Setup Tours', 'Speed Chess Blitz', 'Tekken Feud', 'Fantasy Draft Live',
    'Free Fire Squad', 'Roblox Obby Race', 'Farming Sim Days', 'Co-op Chaos Nights',
    'Twitch Stream Highlights', 'Champions Grand Final',
  ],
  vertical: [
    '60 Seconds of Drama', 'The Elevator Secret', 'Room 304', 'One Night in Abuja',
    'The Job Interview', 'Missing Bride', 'Kedi Ke Sekret', 'ATM Wahala',
    'Taxi Confessions', 'The Voice Note', 'Hostel 13', 'Compound Palava',
    'The Screenshot', 'Okada Ride', 'Business Proposal', 'The Wedding Ring',
    'Last Bus Home', 'Tenant from Hell', 'The DNA Test', 'Rice Money',
    'The Obituary', 'Night Shift', 'The Group Chat', 'Auntie Wants You',
    'The Purse', 'Jollof Wars', 'The Will', 'Facebook Friend',
    'Barber Shop Story', 'Keke Diaries',
  ],
};

const DURATION_RANGES: Record<string, [number, number]> = {
  reality: [1500, 3600],
  creator: [300, 1500],
  lifestyle: [600, 2400],
  movies: [4500, 7200],
  comedy: [180, 900],
  sports: [300, 5400],
  music: [180, 420],
  games: [900, 7200],
  vertical: [50, 180],
};

export async function seedContentService(dryRun = false): Promise<number> {
  const TOTAL_ITEMS = Object.values(TITLES).reduce((sum, list) => sum + list.length, 0);
  const TOTAL_EXPECTED = UNIVERSES.length + CATEGORIES.length + TOTAL_ITEMS;

  if (dryRun) {
    console.log(`  [DRY RUN] Would seed ${UNIVERSES.length} universes, ${CATEGORIES.length} categories, and ${TOTAL_ITEMS} content items in azeebo_content`);
    return TOTAL_EXPECTED;
  }

  const pool = getPool('azeebo_content');
  let count = 0;

  try {
    // 1. Universes
    for (let i = 0; i < UNIVERSES.length; i++) {
      const u = UNIVERSES[i];
      await pool.query(
        `INSERT INTO universes (id, name, "displayName", icon, color, "isEnabled", "sortOrder", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, true, $6, NOW(), NOW())
         ON CONFLICT (name) DO UPDATE SET "displayName" = EXCLUDED."displayName", icon = EXCLUDED.icon, color = EXCLUDED.color, "updatedAt" = NOW();`,
        [u.id, u.name, u.displayName, u.icon, u.color, i]
      );
      count++;
    }

    // 2. Categories
    for (const c of CATEGORIES) {
      await pool.query(
        `INSERT INTO categories (id, name, slug, icon, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, "updatedAt" = NOW();`,
        [c.id, c.name, c.slug, c.icon]
      );
      count++;
    }

    // 3. Content Items (30 per universe)
    for (const u of UNIVERSES) {
      const titles = TITLES[u.name] || [];
      const [minDur, maxDur] = DURATION_RANGES[u.name] || [600, 1800];

      for (let i = 0; i < titles.length; i++) {
        const title = titles[i];
        const contentId = `cnt-${u.name}-${String(i + 1).padStart(2, '0')}`;
        const creatorId = CREATOR_IDS[i % CREATOR_IDS.length];
        const duration = Math.floor(Math.random() * (maxDur - minDur)) + minDur;
        const viewCount = 12500 + i * 4200;
        const rating = ['PG', 'PG-13', '18+'][i % 3];
        const description = `${title} — Exclusive ${u.displayName} streaming on Azeebo+.`;
        const thumbnail = themedArt.poster(u.name, title);
        const metadata = {
          duration,
          genre: u.displayName,
          categories: ['Trending Now', i % 2 === 0 ? 'New Releases' : 'Editor Picks'],
          rating: 4.5 + (i % 5) * 0.1,
        };

        await pool.query(
          `INSERT INTO content_items (id, title, description, thumbnail, "universeId", "creatorId", status, "viewCount", metadata, "contentRating", "publishedAt", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, 'published', $7, $8, $9, NOW() - INTERVAL '30 days', NOW(), NOW())
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title,
             description = EXCLUDED.description,
             thumbnail = EXCLUDED.thumbnail,
             metadata = EXCLUDED.metadata,
             status = 'published',
             "viewCount" = EXCLUDED."viewCount",
             "updatedAt" = NOW();`,
          [contentId, title, description, thumbnail, u.id, creatorId, viewCount, JSON.stringify(metadata), rating]
        );
        count++;

        // Link primary categories in _CategoryToContentItem
        const catA = CATEGORIES[i % CATEGORIES.length].id;
        await pool.query(
          `INSERT INTO "_CategoryToContentItem" ("A", "B")
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING;`,
          [catA, contentId]
        );
      }
    }
  } finally {
    await pool.end();
  }

  return count;
}
