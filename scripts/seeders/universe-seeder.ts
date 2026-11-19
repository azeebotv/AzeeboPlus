/**
 * Azeebo+ All-Universe Comprehensive Seeder
 *
 * Populates realistic Nigerian entertainment and cultural data across all
 * universe databases:
 *   1. azeebo_reality     (Shows, Seasons, Episodes, Contestants, Clips, Predictions)
 *   2. azeebo_movie       (Genres, Movies, Premieres, Viewing Windows, Cinema Passes)
 *   3. azeebo_comedy      (Comedians, Specials, Clips, Series, Episodes, Challenges)
 *   4. azeebo_games       (Games, Questions, Challenges, Tournaments, Prizes)
 *   5. azeebo_sports      (Sports Events, Teams, Highlights, Prediction Markets, Contests)
 *   6. azeebo_vertical    (Storyworlds/UniverseMaps, Characters, Locations, Lore, Titles, Crossovers, Timeline)
 *   7. azeebo_lifestyle   (Nightlife, Events, Itineraries, Neighborhoods, Partners)
 *   8. azeebo_creator     (Creator Profiles, Channels, Challenges, Tiers)
 *   9. azeebo_live_event  (Live Events, Tickets)
 *
 * Fully idempotent: safe to run repeatedly (uses deterministic UUIDs & ON CONFLICT).
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

// Fixed shared creator and user IDs for referential integrity
const USER_IDS = {
  admin: '00000000-0000-4000-8000-000000000001',
  creator1: '00000000-0000-4000-8000-000000000002', // Basketmouth
  creator2: '00000000-0000-4000-8000-000000000003', // Bovi
  creator3: '00000000-0000-4000-8000-000000000004', // Taaooma
  creator4: '00000000-0000-4000-8000-000000000005', // Sabinus
  creator5: '00000000-0000-4000-8000-000000000006', // Broda Shaggi
};

const UNIVERSE_IDS = {
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

// ─────────────────────────────────────────────────────────────────────────────
// 1. REALITY UNIVERSE (azeebo_reality)
// ─────────────────────────────────────────────────────────────────────────────
export async function seedRealityUniverse(): Promise<number> {
  const pool = getPool('azeebo_reality');
  let records = 0;
  try {
    // Ensure base user stubs exist
    for (const [key, uid] of Object.entries(USER_IDS)) {
      await pool.query(
        `INSERT INTO users (id, email, "displayName", role, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, 'user', NOW(), NOW())
         ON CONFLICT (id) DO NOTHING;`,
        [uid, `${key}@azeebo.test`, key.toUpperCase()]
      );
    }

    const shows = [
      {
        id: 'cnt00001-0000-0000-0000-000000000001',
        title: 'Big Brother Naija: Season 10 (All Stars)',
        description: '24 housemates lock into the Big Brother house for 72 days of high drama, evictions, and ultimate stardom.',
        thumbnail: themedArt.poster('reality', 'BBNaija Season 10 All Stars'),
        banner: themedArt.banner('reality', 'BBNaija Season 10 All Stars'),
        universeId: UNIVERSE_IDS.reality,
        status: 'published',
      },
      {
        id: 'rst-dev-002',
        title: 'Ultimate Love: Lagos Match',
        description: 'Single Nigerian bachelors and bachelorettes look for genuine romance under intense public voting.',
        thumbnail: themedArt.poster('reality', 'Ultimate Love Lagos Match'),
        banner: themedArt.banner('reality', 'Ultimate Love Lagos Match'),
        universeId: UNIVERSE_IDS.reality,
        status: 'published',
      },
      {
        id: 'rst-dev-003',
        title: 'Naija Star Search: The Next Afrobeats Icon',
        description: 'Emerging vocalists and performers battle on live television for a 50 Million Naira recording contract.',
        thumbnail: themedArt.poster('reality', 'Naija Star Search Afrobeats'),
        banner: themedArt.banner('reality', 'Naija Star Search Afrobeats'),
        universeId: UNIVERSE_IDS.reality,
        status: 'published',
      },
      {
        id: 'rst-dev-004',
        title: 'The Real Housewives of Lagos: Uncut',
        description: 'Glamour, private jets, high fashion, and explosive feuds with Lagos top socialites.',
        thumbnail: themedArt.poster('reality', 'Real Housewives of Lagos Uncut'),
        banner: themedArt.banner('reality', 'Real Housewives of Lagos Uncut'),
        universeId: UNIVERSE_IDS.reality,
        status: 'published',
      },
    ];

    for (const s of shows) {
      await pool.query(
        `INSERT INTO reality_shows (id, title, description, thumbnail, banner, "universeId", status, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, thumbnail = EXCLUDED.thumbnail;`,
        [s.id, s.title, s.description, s.thumbnail, s.banner, s.universeId, s.status]
      );
      records++;
    }

    // Seasons
    for (const s of shows) {
      await pool.query(
        `INSERT INTO reality_seasons (id, "showId", number, title, description, "createdAt", "updatedAt")
         VALUES ($1, $2, 1, 'Season 1', 'Official Season 1', NOW(), NOW())
         ON CONFLICT (id) DO NOTHING;`,
        [`season-${s.id}`, s.id]
      );
      records++;
    }

    // Contestants for BBNaija
    const contestants = [
      { id: 'rc-dev-001', showId: 'cnt00001-0000-0000-0000-000000000001', name: 'Adaora Eze', description: 'Fashion designer and energy queen from Enugu' },
      { id: 'rc-dev-002', showId: 'cnt00001-0000-0000-0000-000000000001', name: 'Chidi Obi', description: 'Tech founder and fitness enthusiast from Lagos' },
      { id: 'rc-dev-003', showId: 'cnt00001-0000-0000-0000-000000000001', name: 'Amara Kanu', description: 'Afrobeats dancer and social media content creator' },
      { id: 'rc-dev-004', showId: 'cnt00001-0000-0000-0000-000000000001', name: 'Tobi Bakre Jr.', description: 'Actor, model, and competitive housemate' },
      { id: 'rc-dev-005', showId: 'cnt00001-0000-0000-0000-000000000001', name: 'Eniola Alao', description: 'Culinary chef and crowd favourite' },
      { id: 'rc-dev-006', showId: 'cnt00001-0000-0000-0000-000000000001', name: 'Somtochukwu', description: 'Music producer and quiet strategist' },
      { id: 'rc-dev-007', showId: 'rst-dev-002', name: 'Zainab Balogun', description: 'PR consultant seeking true connection' },
      { id: 'rc-dev-008', showId: 'rst-dev-002', name: 'Femi Adebayo', description: 'Real estate developer looking for love' },
    ];

    for (const c of contestants) {
      await pool.query(
        `INSERT INTO reality_contestants (id, "showId", name, description, thumbnail, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;`,
        [c.id, c.showId, c.name, c.description, themedArt.avatar(c.name)]
      );
      records++;
    }

    // Episodes
    const episodes = [
      { id: 'rep-001', showId: 'cnt00001-0000-0000-0000-000000000001', title: 'Grand Launch: The 24 Arrive', number: 1 },
      { id: 'rep-002', showId: 'cnt00001-0000-0000-0000-000000000001', title: 'Head of House Challenge: The Obstacle', number: 2 },
      { id: 'rep-003', showId: 'cnt00001-0000-0000-0000-000000000001', title: 'First Nominations & Secrets Revealed', number: 3 },
      { id: 'rep-004', showId: 'cnt00001-0000-0000-0000-000000000001', title: 'Sunday Live Eviction Night #1', number: 4 },
    ];

    for (const ep of episodes) {
      await pool.query(
        `INSERT INTO reality_episodes (id, "showId", title, number, thumbnail, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;`,
        [ep.id, ep.showId, ep.title, ep.number, themedArt.wide('reality', ep.title)]
      );
      records++;
    }

  } finally {
    await pool.end();
  }
  return records;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. MOVIES UNIVERSE (azeebo_movie)
// ─────────────────────────────────────────────────────────────────────────────
export async function seedMoviesUniverse(): Promise<number> {
  const pool = getPool('azeebo_movie');
  let records = 0;
  try {
    for (const [key, uid] of Object.entries(USER_IDS)) {
      await pool.query(
        `INSERT INTO users (id, email, "displayName", role, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, 'user', NOW(), NOW())
         ON CONFLICT (id) DO NOTHING;`,
        [uid, `${key}@azeebo.test`, key.toUpperCase()]
      );
    }

    const genres = [
      { id: 'gen-001', name: 'Nollywood Epic', slug: 'nollywood-epic', description: 'Period epics, Yoruba folklore, royalty and warfare' },
      { id: 'gen-002', name: 'Lagos Action & Crime', slug: 'action-thriller', description: 'Heists, high-speed chases, and underworld battles' },
      { id: 'gen-003', name: 'Romantic Comedy', slug: 'romcom', description: 'High-society Lagos weddings, modern courtship, and laughs' },
      { id: 'gen-004', name: 'Drama & Suspense', slug: 'drama', description: 'Heart-wrenching family sagas and political thrillers' },
      { id: 'gen-005', name: 'Supernatural Mystery', slug: 'mystery', description: 'Ancestral mysteries, curses, and modern investigators' },
    ];

    for (const g of genres) {
      await pool.query(
        `INSERT INTO genres (id, name, slug, description, "sortOrder", "isActive", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, 1, true, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;`,
        [g.id, g.name, g.slug, g.description]
      );
      records++;
    }

    const movies = [
      {
        id: 'mov-dev-001',
        title: 'The Black Book 2: Shadows of Abuja',
        description: 'Paul Edima returns when a new syndicate threatens the fragile peace, uncovering conspiracies at the highest level of government.',
        genreId: 'gen-002',
        creatorId: USER_IDS.creator1,
      },
      {
        id: 'mov-dev-002',
        title: 'Jagun Jagun: Kingdom of Shadows',
        description: 'A young warrior battles ruthless warlords in a mythical Yoruba empire where honor demands the ultimate sacrifice.',
        genreId: 'gen-001',
        creatorId: USER_IDS.creator2,
      },
      {
        id: 'mov-dev-003',
        title: 'Anikulapo: Curse of the Kings',
        description: 'Saro faces the wrath of the ancients as his resurrection powers trigger an unearthly struggle for Oyo throne.',
        genreId: 'gen-001',
        creatorId: USER_IDS.creator3,
      },
      {
        id: 'mov-dev-004',
        title: 'King of Boys: The Final Throne',
        description: 'Eniola Salami consolidates her political empire as ruthless new challengers emerge from the shadows of Lagos Island.',
        genreId: 'gen-004',
        creatorId: USER_IDS.creator4,
      },
      {
        id: 'mov-dev-005',
        title: 'Gangs of Isale Eko: Reborn',
        description: 'A gritty, pulse-pounding street drama chronicling the rise of three childhood brothers across Lagos lagoon.',
        genreId: 'gen-002',
        creatorId: USER_IDS.creator5,
      },
      {
        id: 'mov-dev-006',
        title: 'A Tribe Called Judah: The Lagos Vault',
        description: 'The Judah family reunites for an impossible high-stakes heist targeting an illicit offshore bullion depot.',
        genreId: 'gen-003',
        creatorId: USER_IDS.creator1,
      },
      {
        id: 'mov-dev-007',
        title: 'Breath of Life: The Symphony',
        description: 'An inspirational tale of grief, faith, and unconditional friendship in 1960s Ibadan.',
        genreId: 'gen-004',
        creatorId: USER_IDS.creator2,
      },
      {
        id: 'mov-dev-008',
        title: 'Wedding Party 3: The Royal Destination',
        description: 'The Onwuka and Coker families descend upon Dubai for an extravagant wedding with unexpected family secrets.',
        genreId: 'gen-003',
        creatorId: USER_IDS.creator3,
      },
    ];

    for (const m of movies) {
      await pool.query(
        `INSERT INTO movies (id, title, description, thumbnail, banner, "universeId", "creatorId", status, "viewCount", "genreId", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'published', 14500, $8, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;`,
        [m.id, m.title, m.description, themedArt.poster('movie', m.title), themedArt.banner('movie', m.title), UNIVERSE_IDS.movies, m.creatorId, m.genreId]
      );
      records++;

      // Premiere
      await pool.query(
        `INSERT INTO premieres (id, "movieId", "startsAt", status, "createdAt", "updatedAt")
         VALUES ($1, $2, NOW() + INTERVAL '3 days', 'scheduled', NOW(), NOW())
         ON CONFLICT (id) DO NOTHING;`,
        [`prem-${m.id}`, m.id]
      );
      records++;

      // Viewing window
      await pool.query(
        `INSERT INTO viewing_windows (id, "movieId", "startsAt", type, "isActive", "createdAt", "updatedAt")
         VALUES ($1, $2, NOW() - INTERVAL '1 day', 'standard', true, NOW(), NOW())
         ON CONFLICT (id) DO NOTHING;`,
        [`win-${m.id}`, m.id]
      );
      records++;
    }

    // Cinema passes
    const passes = [
      { id: 'pass-001', name: 'Nollywood Unlimited VIP Pass', type: 'monthly', price: '4500.00', description: 'Unlimited streaming of new Nollywood premieres and box-office titles.' },
      { id: 'pass-002', name: 'Weekend Blockbuster Pass', type: 'weekend', price: '2000.00', description: '72-hour weekend access to all premiere movies and exclusive behind-the-scenes.' },
      { id: 'pass-003', name: 'Indie Cinema Backer Pass', type: 'annual', price: '40000.00', description: 'Annual pass granting VIP invitations to physical screenings in Lagos & Abuja.' },
    ];

    for (const p of passes) {
      await pool.query(
        `INSERT INTO cinema_passes (id, name, description, type, price, currency, features, "isActive", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, 'NGN', ARRAY['HD & 4K Streaming', 'Zero Ads', 'Offline Downloads'], true, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price;`,
        [p.id, p.name, p.description, p.type, p.price]
      );
      records++;
    }
  } finally {
    await pool.end();
  }
  return records;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. COMEDY UNIVERSE (azeebo_comedy)
// ─────────────────────────────────────────────────────────────────────────────
export async function seedComedyUniverse(): Promise<number> {
  const pool = getPool('azeebo_comedy');
  let records = 0;
  try {
    for (const [key, uid] of Object.entries(USER_IDS)) {
      await pool.query(
        `INSERT INTO users (id, email, "displayName", role, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, 'user', NOW(), NOW())
         ON CONFLICT (id) DO NOTHING;`,
        [uid, `${key}@azeebo.test`, key.toUpperCase()]
      );
    }

    const comedians = [
      { id: 'com-001', userId: USER_IDS.creator1, name: 'Basketmouth', bio: 'Pioneer of contemporary Nigerian stand-up comedy and creator of Flatmates.' },
      { id: 'com-002', userId: USER_IDS.creator2, name: 'Bovi', bio: 'Renowned standup comedian, writer, and star of Man on Fire worldwide tour.' },
      { id: 'com-003', userId: USER_IDS.creator3, name: 'Taaooma', bio: 'Award-winning digital skit comedian famous for relatable African family humor.' },
      { id: 'com-004', userId: USER_IDS.creator4, name: 'Sabinus (Mr Funny)', bio: 'Investor Sabinus - AMVCA best online content creator.' },
      { id: 'com-005', userId: USER_IDS.creator5, name: 'Broda Shaggi', bio: 'Fine Agbero - energetic comedic actor and entertainer.' },
    ];

    for (const c of comedians) {
      await pool.query(
        `INSERT INTO comedian_profiles (id, "userId", bio, banner, verified, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, true, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET bio = EXCLUDED.bio;`,
        [c.id, c.userId, c.bio, themedArt.banner('comedy', c.name)]
      );
      records++;
    }

    // Specials
    const specials = [
      { id: 'spec-001', comedianId: 'com-001', title: 'Basketmouth: Son of Peter Live', genre: 'standup', price: '1500.00' },
      { id: 'spec-002', comedianId: 'com-002', title: 'Bovi: Man on Fire Victoria Island', genre: 'standup', price: '1500.00' },
      { id: 'spec-003', comedianId: 'com-004', title: 'Sabinus: The Corporate Investor Live', genre: 'satire', price: '1200.00' },
      { id: 'spec-004', comedianId: 'com-003', title: 'Taaooma: The Family Meeting Special', genre: 'skit-comedy', price: '1000.00' },
    ];

    for (const sp of specials) {
      await pool.query(
        `INSERT INTO comedy_specials (id, title, description, thumbnail, "mediaUrl", "comedianId", genre, "isPremium", price, currency, "viewCount", "createdAt", "updatedAt")
         VALUES ($1, $2, $2, $3, 'https://cdn.azeebo.test/comedy/special.mp4', $4, $5, true, $6, 'NGN', 24800, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;`,
        [sp.id, sp.title, themedArt.poster('comedy', sp.title), sp.comedianId, sp.genre, sp.price]
      );
      records++;
    }

    // Clips
    const clips = [
      { id: 'clip-001', comedianId: 'com-004', creatorId: USER_IDS.creator4, title: 'Sabinus Invests in Crypto Island' },
      { id: 'clip-002', comedianId: 'com-003', creatorId: USER_IDS.creator3, title: 'When Mum Finds Your Report Card' },
      { id: 'clip-003', comedianId: 'com-005', creatorId: USER_IDS.creator5, title: 'Broda Shaggi At The Embassy Interview' },
      { id: 'clip-004', comedianId: 'com-001', creatorId: USER_IDS.creator1, title: 'Basketmouth: Lagos Landlords and Rent Due' },
      { id: 'clip-005', comedianId: 'com-002', creatorId: USER_IDS.creator2, title: 'Bovi: Nigerian Weddings vs Foreign Weddings' },
    ];

    for (const cl of clips) {
      await pool.query(
        `INSERT INTO comedy_clips (id, "comedianId", "creatorId", title, description, thumbnail, "mediaUrl", "viewCount", "likeCount", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $4, $5, 'https://cdn.azeebo.test/comedy/clip.mp4', 18200, 3420, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;`,
        [cl.id, cl.comedianId, cl.creatorId, cl.title, themedArt.wide('comedy', cl.title)]
      );
      records++;
    }

    // Challenges
    await pool.query(
      `INSERT INTO comedy_challenges (id, title, description, "startsAt", status, "createdAt", "updatedAt")
       VALUES ('com-chal-001', 'Naija Skit Maker Bounty 2026', 'Create the funniest 60-second skit on Lagos traffic and win 1 Million Naira.', NOW(), 'active', NOW(), NOW())
       ON CONFLICT (id) DO NOTHING;`
    );
    records++;
  } finally {
    await pool.end();
  }
  return records;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. GAMES UNIVERSE (azeebo_games)
// ─────────────────────────────────────────────────────────────────────────────
export async function seedGamesUniverse(): Promise<number> {
  const pool = getPool('azeebo_games');
  let records = 0;
  try {
    for (const [key, uid] of Object.entries(USER_IDS)) {
      await pool.query(
        `INSERT INTO users (id, email, "displayName", role, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, 'user', NOW(), NOW())
         ON CONFLICT (id) DO NOTHING;`,
        [uid, `${key}@azeebo.test`, key.toUpperCase()]
      );
    }

    const games = [
      {
        id: 'game-001',
        title: 'Afrobeats Rhythm Master',
        slug: 'afrobeats-rhythm-master',
        category: 'music',
        description: 'Tap to the rhythm of Afrobeats global anthems from Burna Boy, Wizkid, and Asake.',
      },
      {
        id: 'game-002',
        title: 'Nollywood Trivia Showdown',
        slug: 'nollywood-trivia-showdown',
        category: 'trivia',
        description: 'Test your knowledge on classic Nollywood lines, actors, and epic cinema moments.',
      },
      {
        id: 'game-003',
        title: 'Lagos Traffic Escape',
        slug: 'lagos-traffic-escape',
        category: 'arcade',
        description: 'Navigate Danfo buses, Keke Napeps, and road barricades from Ikeja to Lekki Phase 1.',
      },
      {
        id: 'game-004',
        title: 'Super Eagles Penalty King',
        slug: 'super-eagles-penalty-king',
        category: 'sports',
        description: 'Step up to the spot and take championship penalty kicks under roar of National Stadium.',
      },
    ];

    for (const g of games) {
      await pool.query(
        `INSERT INTO games (id, title, slug, description, thumbnail, category, difficulty, "playCount", "isActive", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, 'medium', 8400, true, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;`,
        [g.id, g.title, g.slug, g.description, themedArt.cover('games', g.title), g.category]
      );
      records++;

      // Question for trivia
      await pool.query(
        `INSERT INTO game_questions (id, "gameId", question, answer, options, points, "order", "timeLimit", "createdAt", "updatedAt")
         VALUES ($1, $2, 'Who won the first season of Big Brother Naija in 2006?', 'Katung Aduwak', '["Katung Aduwak", "Ebuka Obi-Uchendu", "Francisca Owumi", "Gideon Okeke"]'::json, 20, 1, 30, NOW(), NOW())
         ON CONFLICT (id) DO NOTHING;`,
        [`q-${g.id}`, g.id]
      );
      records++;
    }

    // Challenges
    const challenges = [
      { id: 'chal-001', title: 'Daily Afrobeats Quiz', type: 'daily', points: 50 },
      { id: 'chal-002', title: 'Weekend Nollywood Gauntlet', type: 'weekly', points: 200 },
      { id: 'chal-003', title: 'Lagos Island Street IQ', type: 'daily', points: 75 },
    ];

    for (const c of challenges) {
      await pool.query(
        `INSERT INTO challenges (id, title, description, type, points, status, "createdAt", "updatedAt")
         VALUES ($1, $2, $2, $3, $4, 'active', NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;`,
        [c.id, c.title, c.type, c.points]
      );
      records++;

      await pool.query(
        `INSERT INTO questions (id, "challengeId", question, answer, options, points, "order", "createdAt", "updatedAt")
         VALUES ($1, $2, 'In what year was the first African Cup of Nations won by Nigeria?', '1980', '["1976", "1980", "1994", "2013"]'::json, 50, 1, NOW(), NOW())
         ON CONFLICT (id) DO NOTHING;`,
        [`cq-${c.id}`, c.id]
      );
      records++;
    }

    // Tournaments
    const tournaments = [
      { id: 'tourn-001', title: 'Lagos Gaming Cup 2026', entryFee: '500.00', prizePool: '1000000.00' },
      { id: 'tourn-002', title: 'Afrobeats Trivia Championship', entryFee: '250.00', prizePool: '500000.00' },
      { id: 'tourn-003', title: 'Super Eagles Virtual Clash', entryFee: '0.00', prizePool: '250000.00' },
    ];

    for (const t of tournaments) {
      await pool.query(
        `INSERT INTO tournaments (id, title, description, "startsAt", "entryFee", "prizePool", status, "createdAt", "updatedAt")
         VALUES ($1, $2, $2, NOW() + INTERVAL '1 day', $3, $4, 'active', NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;`,
        [t.id, t.title, t.entryFee, t.prizePool]
      );
      records++;

      // Prize
      await pool.query(
        `INSERT INTO tournament_prizes (id, "tournamentId", rank, amount, "createdAt", "updatedAt")
         VALUES ($1, $2, 1, $3, NOW(), NOW())
         ON CONFLICT (id) DO NOTHING;`,
        [`pz-${t.id}`, t.id, t.prizePool]
      );
      records++;
    }
  } finally {
    await pool.end();
  }
  return records;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. SPORTS UNIVERSE (azeebo_sports)
// ─────────────────────────────────────────────────────────────────────────────
export async function seedSportsUniverse(): Promise<number> {
  const pool = getPool('azeebo_sports');
  let records = 0;
  try {
    for (const [key, uid] of Object.entries(USER_IDS)) {
      await pool.query(
        `INSERT INTO users (id, email, "displayName", role, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, 'user', NOW(), NOW())
         ON CONFLICT (id) DO NOTHING;`,
        [uid, `${key}@azeebo.test`, key.toUpperCase()]
      );
    }

    const events = [
      {
        id: 'sport-001',
        title: 'NPFL Derby: Enyimba FC vs Remo Stars',
        sport: 'football',
        status: 'upcoming',
        team1: 'Enyimba International FC',
        team2: 'Remo Stars FC',
      },
      {
        id: 'sport-002',
        title: 'International Friendly: Nigeria vs Ghana (Jollof Derby)',
        sport: 'football',
        status: 'upcoming',
        team1: 'Super Eagles (Nigeria)',
        team2: 'Black Stars (Ghana)',
      },
      {
        id: 'sport-003',
        title: 'Nigeria Premier Basketball: Rivers Hoopers vs Kwara Falcons',
        sport: 'basketball',
        status: 'live',
        team1: 'Rivers Hoopers',
        team2: 'Kwara Falcons',
      },
      {
        id: 'sport-004',
        title: 'Access Bank Lagos City Marathon 2026',
        sport: 'athletics',
        status: 'upcoming',
        team1: 'Elite Men',
        team2: 'Elite Women',
      },
    ];

    for (const ev of events) {
      await pool.query(
        `INSERT INTO sports_events (id, title, description, sport, "startsAt", status, "createdAt", "updatedAt")
         VALUES ($1, $2, $2, $3, NOW() + INTERVAL '2 days', $4, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status;`,
        [ev.id, ev.title, ev.sport, ev.status]
      );
      records++;

      // Teams
      await pool.query(
        `INSERT INTO event_teams (id, "eventId", name, score, "order")
         VALUES ($1, $2, $3, 2, 1)
         ON CONFLICT (id) DO NOTHING;`,
        [`tm1-${ev.id}`, ev.id, ev.team1]
      );
      await pool.query(
        `INSERT INTO event_teams (id, "eventId", name, score, "order")
         VALUES ($1, $2, $3, 1, 2)
         ON CONFLICT (id) DO NOTHING;`,
        [`tm2-${ev.id}`, ev.id, ev.team2]
      );
      records += 2;

      // Prediction Market
      await pool.query(
        `INSERT INTO prediction_markets (id, "eventId", question, options, "totalPool", status, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, '["Team 1 Win", "Draw", "Team 2 Win"]'::json, 500000.00, 'active', NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET question = EXCLUDED.question;`,
        [`pm-${ev.id}`, ev.id, `Predict the final result of ${ev.title}`]
      );
      records++;

      // Highlights
      await pool.query(
        `INSERT INTO creator_profiles (id, "userId", "displayName", avatar, bio, verified, "createdAt", "updatedAt")
         VALUES ('sp-cr-001', $1, 'Super Eagles Official', $2, 'Official sports coverage and highlights.', true, NOW(), NOW())
         ON CONFLICT (id) DO NOTHING;`,
        [USER_IDS.creator1, themedArt.avatar('Super Eagles')]
      );

      await pool.query(
        `INSERT INTO highlights (id, "eventId", "creatorId", title, description, thumbnail, "mediaUrl", "viewCount", "createdAt", "updatedAt")
         VALUES ($1, $2, 'sp-cr-001', $3, $3, $4, 'https://cdn.azeebo.test/sports/highlight.mp4', 15200, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;`,
        [`hl-${ev.id}`, ev.id, `Match Highlights: ${ev.title}`, themedArt.wide('sports', ev.title)]
      );
      records++;
    }
  } finally {
    await pool.end();
  }
  return records;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. VERTICAL UNIVERSE (azeebo_vertical)
// ─────────────────────────────────────────────────────────────────────────────
export async function seedVerticalUniverse(): Promise<number> {
  const pool = getPool('azeebo_vertical');
  let records = 0;
  try {
    const universeMaps = [
      {
        id: 'univ-map-001',
        name: 'Agbala: Orisha Chronicles',
        slug: 'orisha-chronicles',
        description: 'An epic Afrofuturistic mythos where ancient Yoruba deities manifest in a shattered multiverse.',
      },
      {
        id: 'univ-map-002',
        name: 'Neo-Lagos 2088',
        slug: 'neo-lagos-2088',
        description: 'Cyberpunk mega-city Lagos where cyber-juju, megacorporations, and lagoon resistance fight for supremacy.',
      },
    ];

    for (const u of universeMaps) {
      await pool.query(
        `INSERT INTO universe_maps (id, name, slug, description, "imageUrl", status, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;`,
        [u.id, u.name, u.slug, u.description, themedArt.wide('vertical', u.name)]
      );
      records++;
    }

    const characters = [
      { id: 'char-001', universeId: 'univ-map-001', name: 'Sango the Thunder King', slug: 'sango-thunder-king', role: 'Deity of Thunder & Justice' },
      { id: 'char-002', universeId: 'univ-map-001', name: 'Oya of the Storm Winds', slug: 'oya-storm-winds', role: 'Goddess of Transformation' },
      { id: 'char-003', universeId: 'univ-map-001', name: 'Ogun Ironmaster', slug: 'ogun-ironmaster', role: 'Lord of Metallurgy & War' },
      { id: 'char-004', universeId: 'univ-map-002', name: 'Zainab Vector', slug: 'zainab-vector', role: 'Cyber-Investigator, Eko Security' },
      { id: 'char-005', universeId: 'univ-map-002', name: 'Kazeem Wire', slug: 'kazeem-wire', role: 'Lagoon Syndicate Netrunner' },
    ];

    for (const ch of characters) {
      await pool.query(
        `INSERT INTO characters (id, name, slug, description, "avatarUrl", role, status, "universeId", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $4, 'active', $6, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;`,
        [ch.id, ch.name, ch.slug, ch.role, themedArt.avatar(ch.name), ch.universeId]
      );
      records++;
    }

    const titles = [
      { id: 'tit-001', universeId: 'univ-map-001', name: 'Wrath of the Thunder King', slug: 'wrath-of-the-thunder-king', type: 'comic' },
      { id: 'tit-002', universeId: 'univ-map-001', name: 'Winds of the Mystic Forest', slug: 'winds-of-the-mystic-forest', type: 'webtoon' },
      { id: 'tit-003', universeId: 'univ-map-002', name: 'Cyber-Eshu: Ghost in the Shrine', slug: 'cyber-eshu-ghost-in-the-shrine', type: 'manga' },
      { id: 'tit-004', universeId: 'univ-map-002', name: 'Neon Lagoon: Rebellion', slug: 'neon-lagoon-rebellion', type: 'interactive' },
    ];

    for (const t of titles) {
      await pool.query(
        `INSERT INTO titles (id, name, slug, type, description, "coverImage", "releaseYear", status, "universeId", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $2, $5, 2026, 'ongoing', $6, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;`,
        [t.id, t.name, t.slug, t.type, themedArt.poster('vertical', t.name), t.universeId]
      );
      records++;

      // Chapters
      await pool.query(
        `INSERT INTO chapters (id, "titleId", number, name, description, status, "createdAt")
         VALUES ($1, $2, 1, 'Episode 1: The Spark', 'The initial awakening that shakes the realm.', 'published', NOW())
         ON CONFLICT (id) DO NOTHING;`,
        [`chap-${t.id}-1`, t.id]
      );
      records++;
    }

    const lores = [
      { id: 'lore-001', universeId: 'univ-map-001', title: 'The Staff of Obalufon', slug: 'staff-of-obalufon', category: 'relics', content: 'Forged from meteorite brass, this ancient staff channels pure solar energy into the hands of the chosen ruler.' },
      { id: 'lore-002', universeId: 'univ-map-001', title: 'The Treaty of the Seven Shrines', slug: 'treaty-of-seven-shrines', category: 'history', content: 'In ancient Ile-Ife, seven divine bloodlines established the foundational covenants governing the realms of earth and sky.' },
      { id: 'lore-003', universeId: 'univ-map-002', title: 'Cyber-Juju Protocols: Neural Infusion', slug: 'cyber-juju-protocols', category: 'technology', content: 'The convergence of ancestral incantations with quantum neural networks created the first digital Orisha interfaces.' },
    ];

    for (const l of lores) {
      await pool.query(
        `INSERT INTO lore_entries (id, title, slug, category, content, excerpt, "coverImage", status, "universeId", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $5, $6, 'published', $7, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content;`,
        [l.id, l.title, l.slug, l.category, l.content, themedArt.wide('vertical', l.title), l.universeId]
      );
      records++;
    }

    // Crossover
    await pool.query(
      `INSERT INTO crossovers (id, title, slug, description, "coverImage", status, "createdAt", "updatedAt")
       VALUES ('cross-001', 'Gods & Circuitry: The Multi-Era Nexus', 'gods-and-circuitry-nexus', 'Ancient deities collide with futuristic cybernetic warriors in an unprecedented temporal rift.', $1, 'announced', NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;`,
      [themedArt.wide('vertical', 'Gods and Circuitry Nexus')]
    );
    records++;
  } finally {
    await pool.end();
  }
  return records;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. LIFESTYLE UNIVERSE (azeebo_lifestyle)
// ─────────────────────────────────────────────────────────────────────────────
export async function seedLifestyleUniverse(): Promise<number> {
  const pool = getPool('azeebo_lifestyle');
  let records = 0;
  try {
    for (const [key, uid] of Object.entries(USER_IDS)) {
      await pool.query(
        `INSERT INTO users (id, email, "displayName", role, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, 'user', NOW(), NOW())
         ON CONFLICT (id) DO NOTHING;`,
        [uid, `${key}@azeebo.test`, key.toUpperCase()]
      );
    }

    // Nightlife Entries
    const nightlife = [
      { id: 'nl-001', name: 'Club Quilox Victoria Island', slug: 'club-quilox-vi', type: 'club', address: 'Ozumba Mbadiwe Ave', description: 'Legendary multi-tiered VIP nightlife venue known for world-class DJs and bottle service.' },
      { id: 'nl-002', name: 'Zaza Lounge & Supper Club', slug: 'zaza-lounge-ikeja', type: 'lounge', address: 'Ikeja GRA', description: 'Intimate, sultry dining and cocktails transitioning into a high-energy late-night lounge.' },
      { id: 'nl-003', name: 'Moist Beach Club', slug: 'moist-beach-club-oniru', type: 'beach-club', address: 'Oniru Beach, VI', description: 'Oceanfront cabanas, fresh seafood, afro-house sunset sets, and beachfront fires.' },
      { id: 'nl-004', name: 'The Library Lounge Lekki', slug: 'the-library-lounge-lekki', type: 'bar', address: 'Lekki Phase 1', description: 'Speakeasy hidden behind vintage bookshelves serving bespoke African botanical cocktails.' },
    ];

    for (const n of nightlife) {
      await pool.query(
        `INSERT INTO "NightlifeEntry" (id, name, slug, type, description, address, city, country, "coverImage", rating, status, "createdById", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, 'Lagos', 'Nigeria', $7, 4.8, 'published', $8, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;`,
        [n.id, n.name, n.slug, n.type, n.description, n.address, themedArt.wide('lifestyle', n.name), USER_IDS.admin]
      );
      records++;
    }

    // Events
    const events = [
      { id: 'evt-001', title: 'Lagos Fashion Week: The Grand Gala', slug: 'lagos-fashion-week-gala', location: 'Victoria Island', venue: 'Federal Palace Hotel' },
      { id: 'evt-002', title: 'Afrobeats Sunset Beach Fest', slug: 'afrobeats-sunset-beach-fest', location: 'Oniru', venue: 'Landmark Beach' },
      { id: 'evt-003', title: 'Eko Gourmet Culinary Crawl', slug: 'eko-gourmet-culinary-crawl', location: 'Ikoyi', venue: 'Multiple Venues' },
      { id: 'evt-004', title: 'Tech, Afro-Beats & Tacos Mixer', slug: 'tech-afrobeats-tacos-mixer', location: 'Victoria Island', venue: 'Creative Hub Lagos' },
    ];

    for (const e of events) {
      await pool.query(
        `INSERT INTO "Event" (id, title, slug, description, "coverImage", location, venue, "creatorId", "startDate", "endDate", status, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $2, $4, $5, $6, $7, NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days' + INTERVAL '6 hours', 'published', NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;`,
        [e.id, e.title, e.slug, themedArt.wide('lifestyle', e.title), e.location, e.venue, USER_IDS.admin]
      );
      records++;
    }
  } finally {
    await pool.end();
  }
  return records;
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. CREATOR UNIVERSE (azeebo_creator)
// ─────────────────────────────────────────────────────────────────────────────
export async function seedCreatorUniverse(): Promise<number> {
  const pool = getPool('azeebo_creator');
  let records = 0;
  try {
    const dummyPasswordHash = '$2b$10$ep/0Q3RjSgXn8V.w2EfZ2uFz8k9B/Z9gL2S1LqfE3X0a1V3e4k8zW';
    for (const [key, uid] of Object.entries(USER_IDS)) {
      await pool.query(
        `INSERT INTO users (id, email, password, "displayName", role, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, 'creator', NOW(), NOW())
         ON CONFLICT (id) DO NOTHING;`,
        [uid, `${key}@azeebo.test`, dummyPasswordHash, key.toUpperCase()]
      );
    }

    const creators = [
      { id: 'cr-001', userId: USER_IDS.creator1, name: 'Basketmouth Productions', bio: 'Original comedy specials, Flatmates episodes, and podcast broadcasts.' },
      { id: 'cr-002', userId: USER_IDS.creator2, name: 'Bovi Studios', bio: 'Cinema-grade comedy, theatrical monologues, and behind-the-scenes filmmaking.' },
      { id: 'cr-003', userId: USER_IDS.creator3, name: 'Taaooma Originals', bio: 'The beloved comedy universe of African home life, sketches, and characters.' },
      { id: 'cr-004', userId: USER_IDS.creator4, name: 'Sabinus Entertainment', bio: 'Investor Sabinus official comedy clips, tours, and sketch series.' },
      { id: 'cr-005', userId: USER_IDS.creator5, name: 'Broda Shaggi TV', bio: 'Action-comedy parodies, street interviews, and live theater productions.' },
    ];

    for (const c of creators) {
      await pool.query(
        `INSERT INTO creator_profiles (id, "userId", "displayName", avatar, bio, banner, verified, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET "displayName" = EXCLUDED."displayName", bio = EXCLUDED.bio;`,
        [c.id, c.userId, c.name, themedArt.avatar(c.name), c.bio, themedArt.banner('creator', c.name)]
      );
      records++;

      // Channel
      await pool.query(
        `INSERT INTO channels (id, "creatorId", name, description, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         ON CONFLICT (id) DO NOTHING;`,
        [`ch-${c.id}`, c.id, `${c.name} Official`, c.bio]
      );
      records++;

      // Subscription Tier
      await pool.query(
        `INSERT INTO subscription_tiers (id, "creatorId", name, price, perks, "isActive", "createdAt", "updatedAt")
         VALUES ($1, $2, 'VIP Inner Circle', 2500.00, '["Early Video Access", "Exclusive Discord Badge", "Monthly Q&A"]'::jsonb, true, NOW(), NOW())
         ON CONFLICT (id) DO NOTHING;`,
        [`tier-${c.id}`, c.id]
      );
      records++;
    }

    // Challenges
    await pool.query(
      `INSERT INTO creator_challenges (id, "creatorId", title, description, prize, status, "startDate", "endDate", "createdAt")
       VALUES ('cc-001', 'cr-001', 'Naija High-Energy Comedy Challenge', 'Submit your best 45-second skit portraying modern Nigerian living.', '5,000,000 NGN', 'active', NOW() - INTERVAL '2 days', NOW() + INTERVAL '14 days', NOW())
       ON CONFLICT (id) DO NOTHING;`
    );
    records++;
  } finally {
    await pool.end();
  }
  return records;
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. LIVE EVENT UNIVERSE (azeebo_live_event)
// ─────────────────────────────────────────────────────────────────────────────
export async function seedLiveEventUniverse(): Promise<number> {
  const pool = getPool('azeebo_live_event');
  let records = 0;
  try {
    const events = [
      {
        id: 'live-001',
        title: 'Burna Boy: Live from Eko Convention Center',
        description: 'The African Giant brings his globe-conquering stadium show to Lagos for an exclusive global livestream.',
        organizerId: USER_IDS.creator1,
        ticketPrice: '5000.00',
        duration: 180,
      },
      {
        id: 'live-002',
        title: 'Lords of the Ribs: Live Standup Gala 2026',
        description: 'Basketmouth headlines an unforgettable evening with Africa finest comedic minds on one stage.',
        organizerId: USER_IDS.creator1,
        ticketPrice: '3500.00',
        duration: 150,
      },
      {
        id: 'live-003',
        title: 'Nollywood Gold: Red Carpet Gala & Premiere',
        description: 'Live red carpet arrivals, star interviews, and world premiere screening with Nollywood royalty.',
        organizerId: USER_IDS.creator2,
        ticketPrice: '7500.00',
        duration: 210,
      },
    ];

    for (const ev of events) {
      await pool.query(
        `INSERT INTO live_events (id, title, description, thumbnail, "organizerId", "scheduledAt", duration, status, "ticketPrice", currency, "maxViewers", "currentViewers", "chatEnabled", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '3 days', $6, 'scheduled', $7, 'NGN', 50000, 1420, true, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;`,
        [ev.id, ev.title, ev.description, themedArt.wide('reality', ev.title), ev.organizerId, ev.duration, ev.ticketPrice]
      );
      records++;

      await pool.query(
        `INSERT INTO live_event_tickets (id, "eventId", "userId", amount, currency, status, "purchasedAt")
         VALUES ($1, $2, $3, $4, 'NGN', 'valid', NOW())
         ON CONFLICT (id) DO NOTHING;`,
        [`tkt-${ev.id}`, ev.id, USER_IDS.admin, ev.ticketPrice]
      );
      records++;
    }
  } finally {
    await pool.end();
  }
  return records;
}

// ─────────────────────────────────────────────────────────────────────────────
// Master Seeder Function
// ─────────────────────────────────────────────────────────────────────────────
export async function seedAllUniverses(): Promise<{ universe: string; count: number }[]> {
  console.log('🚀 Starting Comprehensive Seeding for All 9 Universes...');
  const results: { universe: string; count: number }[] = [];

  const seeders = [
    { name: 'reality', fn: seedRealityUniverse },
    { name: 'movies', fn: seedMoviesUniverse },
    { name: 'comedy', fn: seedComedyUniverse },
    { name: 'games', fn: seedGamesUniverse },
    { name: 'sports', fn: seedSportsUniverse },
    { name: 'vertical', fn: seedVerticalUniverse },
    { name: 'lifestyle', fn: seedLifestyleUniverse },
    { name: 'creator', fn: seedCreatorUniverse },
    { name: 'live-event', fn: seedLiveEventUniverse },
  ];

  for (const s of seeders) {
    try {
      const count = await s.fn();
      console.log(`  ✓ ${s.name.padEnd(12)} -> ${count} records seeded`);
      results.push({ universe: s.name, count });
    } catch (err) {
      console.error(`  ✗ ${s.name.padEnd(12)} failed:`, (err as Error).message);
      results.push({ universe: s.name, count: 0 });
    }
  }

  console.log('🎉 Universe Seeding Completed!');
  return results;
}

// Execute directly if run as main
if (process.argv[1]?.endsWith('universe-seeder.ts') || process.argv[1]?.endsWith('universe-seeder.js')) {
  seedAllUniverses()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Master universe seed failed:', err);
      process.exit(1);
    });
}
