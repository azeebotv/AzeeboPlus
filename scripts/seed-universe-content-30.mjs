#!/usr/bin/env node
// ============================================================================
// seed-universe-content-30.mjs — top each universe up to >=30 content items
//
// The public web universe pages (/reality /movies /comedy /sports /music
// /games /vertical /lifestyle) pull from content-service (azeebo_content).
// Existing dev seed left several universes with <10 items. This script counts
// existing PUBLISHED items per universe and inserts enough new ones (30 each
// or top-up to 30, whichever is larger) with plausible Nigerian-entertainment
// titles, realistic view counts, and correct universe/creator references.
//
// Idempotent: re-running tops up only to 30 — existing rows are untouched.
// After insert it syncs new rows into azeebo_search.content_items so search
// returns them (the search service reads its own DB copy).
//
// Usage: node scripts/seed-universe-content-30.mjs
// ============================================================================
import { execSync } from 'node:child_process';

const PSQL = (db, sql) =>
  execSync(`psql -h localhost -U azeebo -d ${db} -v ON_ERROR_STOP=1 -q`, {
    env: { ...process.env, PGPASSWORD: 'change-me-in-production' },
    encoding: 'utf8',
    input: sql,
  });

const UNIVERSES = [
  { id: 'u0000001-0000-0000-0000-000000000001', name: 'reality', label: 'Reality' },
  { id: 'u0000001-0000-0000-0000-000000000002', name: 'creator', label: 'Creator' },
  { id: 'u0000001-0000-0000-0000-000000000003', name: 'lifestyle', label: 'Lifestyle' },
  { id: 'u0000001-0000-0000-0000-000000000004', name: 'movies', label: 'Movies' },
  { id: 'u0000001-0000-0000-0000-000000000005', name: 'comedy', label: 'Comedy' },
  { id: 'u0000001-0000-0000-0000-000000000006', name: 'sports', label: 'Sports' },
  { id: 'u0000001-0000-0000-0000-000000000007', name: 'music', label: 'Music' },
  { id: 'u0000001-0000-0000-0000-000000000008', name: 'games', label: 'Games' },
  { id: 'u0000001-0000-0000-0000-000000000009', name: 'vertical', label: 'Vertical' },
];

const CREATORS = [
  'a0000001-0000-0000-0000-000000000003', // Demo Creator
  'a0000001-0000-0000-0000-000000000004', // Ngozi Vibes
  'a0000001-0000-0000-0000-000000000005', // Emeka Studios
  'a0000001-0000-0000-0000-000000000011', // Chinedu Sports
  'a0000001-0000-0000-0000-000000000012', // Tunde Gaming
];

const TITLES = {
  reality: ['BBNaija Diary Room Secrets', 'Shine Ya Eye Reunion', 'The Real Housemates', 'Lagos House Guest', 'Ultimate Love Stories', 'Naija Idol Auditions', 'Dance Challenge Nigeria', 'The Influencer House', 'Kampala Nights', 'Celebrity Gist Live', 'Survivor Naija', 'Big Brother Hot Shots', 'Date My Family NG', 'Come Dine With Me Lagos', 'The Voice Naija', 'Ex on the Beach Naija', 'Mastermate House', 'The Gist Corner', 'Wahala After Dark', 'Campus Queen', 'Market Queens', 'Lagos Socialites', 'The Rich Aunty Show', 'Island Life NG', 'Kano Chronicles', 'Abuja Elites', 'Portharcourt Palava', 'The Grandma Squad', 'Road Trip Reality', 'Naija Wedding Wars'],
  creator: ['Studio Setup Tour', 'How I Edit My Videos', 'Creator Money Talk', 'Vlog: Market Day', 'Skits That Paid My Rent', 'Building a Brand in Lagos', 'My Content Calendar', 'Camera Gear for Beginners', 'Lighting on a Budget', 'From 0 to 100k Subscribers', 'Cooking Content 101', 'Travel Vlogging Nigeria', 'Tech Review Basics', 'Fitness Creator Journey', 'Fashion Haul & Review', 'Podcasting in Nigeria', 'Monetizing Tips & Tricks', 'Behind the Scenes Shoot', 'Collab Week Diaries', 'Growing on Multiple Platforms', 'Creator Burnout Talk', 'Reading My Comments', 'Testing Viral Hacks', 'Wardrobe Essentials', 'Skit Production Day', 'My Office Studio', 'Q&A with Fans', 'Brand Deal Breakdown', 'Naija Street Food Tour', 'Room Makeover'],
  lifestyle: ['Lagos Nightlife Guide', 'Asebi Fashion Week', 'Street Food Trail: Yaba', 'Wedding Lookbook 2026', 'Skincare for Harmattan', 'Weekend in Calabar', 'High Tea in Ikoyi', 'Sneaker Culture Naija', 'Brunch Spots VI', 'Owambe Style Guide', 'Thrift Shopping Lekki', 'Home Decor Naija', 'Fitness for Busy People', 'Natural Hair Care', 'Makeup for Dark Skin', 'Romantic Getaways NG', 'Suya Crawl: Abuja', 'Beach Day: Tarkwa Bay', 'Interior Design on a Budget', 'Corporate Style Tips', 'Nigerian DJs to Know', 'Art Galleries Lagos', 'Date Night Ideas', 'Luxury vs Budget: Spa', 'Aso Ebi Trends', 'Photography Walk: City', 'Plant Parenting 101', 'Cocktail Hour Recipes', 'Road Trip Essentials', 'Cultural Festivals Guide'],
  movies: ['The Nollywood Heist', 'Anikulapo Rising', 'Lagos Taxi Driver', 'King of Boys III', 'The Son of the Soil', 'Ijeoma Returns', 'Csar of Aba', 'Blood Vessel', 'House of Ga Remake', 'Brotherhood II', 'Citation Story', 'The Milkmaid', '93 Days Later', 'October 1 Sequel', 'The Wedding Party 4', 'Chief Daddy Returns', 'Omo Ghetto III', 'Sugar Rush 2', 'Eyimofe Nights', 'This Is Lagos', 'Mami Wata Tale', 'Ajosepo Secrets', 'Funmilayo Rises', 'A Tribe Called Judah II', 'Orisa Legend', 'Kesari The Warrior', 'Jagun Jagun II', 'Elesin Oba Story', 'Green White Green', 'Up North Journey'],
  comedy: ['Mark Angel Classics', 'Sabinus in Trouble', 'Lasisi Go To School', 'Bae U Bars', 'Mr Macaroni Skit', 'Sydney Talker Pranks', 'Nons Miraj Comedy', 'Taooma Abuja Life', 'Broda Shaggi Street', 'Zicsaloma Choir', 'Brain Jotter Landlord', 'Lord Lamba Delivery', 'SamSpedy Mama T', 'Kiekie Market Run', 'Warri Pikin Gym', 'The Other Side Skits', 'Crazeclown When', 'D FPredictable Comedy', 'Officer Woos Arrest', 'Oluwadolarz Roommate', 'Isbae U Sirbalo', 'Remedy Control Crowd', 'Twins Oluoma Comedy', 'Ekwutos Comedy Skit', 'Mama Felicia Kitchen', 'Naija Police Checkpoint', 'Danfo Drivers Palava', 'Generator Wahala', 'NEPA Bill Saga', 'Village Meeting'],
  sports: ['AFCON Qualifier Highlights', 'Lagos Marathon 2026', 'NPFL Derby Day', 'Super Eagles Training', 'Basketball League Finals', 'Boxing Night Lagos', 'Table Tennis Masters', 'Wrestling Championship', 'Cycling Tour Naija', 'Swimming Trials', 'Athletics Grand Prix', 'Football Academy Tour', 'Rugby in Nigeria', 'Volleyball Nationals', 'Handball Cup Final', 'Kicks Naija Weekly', 'Stadium Tour: Moshood', 'Women Football Rising', 'Goalkeeping Masterclass', 'Futsal Street Cup', 'Cricket Comes Home', 'Badminton Open', 'Chess Grandmasters NG', 'Gaming Olympics Tryout', 'Fans Corner Debate', 'Transfer Window Talk', 'Coach Corner Tactics', 'Youth League Spotlight', 'DStv Premiership Review', 'Legends Match Day'],
  music: ['Afrobeats Live Session', 'Fuji Meets Jazz', 'Gospel Praise Night', 'Alté Vibes Concert', 'Amapiano Naija Mix', 'Studio Session: Beats', 'Street Hop Cypher', 'Highlife Legends', 'Gbedu Awards Night', 'Coke Studio Naija', 'Unplugged Lagos', 'Drumline Battle', 'Kora Strings Night', 'Owambe DJ Set', 'Rap Royale', 'Soul Train Naija', 'Reggae on the Beach', 'Traditional Drums Tour', 'Choir Competitions', 'Waka Music Revival', 'Apala Nights', 'Sakara Special', 'Jùjú Sunday Sessions', 'Afrofusion Concert', 'Live Band Karaoke', 'Open Mic Fridays', 'Festival Main Stage', 'Rooftop Acoustic', 'Midnight Jazz Café', 'Producer Camp Finale'],
  games: ['FIFA Naija Cup', 'Call of Duty Lagos', 'Mortal Kombat Tourney', 'Chess AI Showdown', 'Racing Sim League', 'PUBG Squad Naija', 'Minecraft Build-Off', 'Valorant Campus Clash', 'FIFA Career Mode', 'Mobile Legends Rank', 'NBA 2K Streetball', 'Fight Night Arcade', 'Retro Gaming Night', 'Speedrun Marathon', 'Quiz Showdown', 'Board Game Cafe', 'D&D Campaign NG', 'Esports Awards', 'Team Scrims Vlog', 'Controller vs Keyboard', 'Gaming Setup Tours', 'Speed Chess Blitz', 'Tekken Feud', 'Fantasy Draft Live', 'Free Fire Squad', 'Roblox Obby Race', 'Farming Sim Days', 'Co-op Chaos Nights', 'Twitch Stream Highlights', 'Champions Grand Final'],
  vertical: ['60 Seconds of Drama', 'The Elevator Secret', 'Room 304', 'One Night in Abuja', 'The Job Interview', 'Missing Bride', 'Kedi Ke Sekret', 'ATM Wahala', 'Taxi Confessions', 'The Voice Note', 'Hostel 13', ' compound Palava', 'The Screenshot', 'Okada Ride', 'Business Proposal', 'The Wedding Ring', 'Last Bus Home', 'Tenant from Hell', 'The DNA Test', 'Rice Money', 'The Obituary', 'Night Shift', 'The Group Chat', 'Auntie Wants You', 'The Purse', 'Jollof Wars', 'The Will', 'Facebook Friend', 'Barber Shop Story', 'Keke Diaries'],
};

const DESCRIPTIONS = [
  'A brand-new exclusive from the heart of Naija entertainment.',
  'Trending now — the whole timeline is talking about this one.',
  'Fan-favorite series returning with bigger drama and better vibes.',
  'Behind the scenes with Nigeria’s finest creators and storytellers.',
  'Pure entertainment — jollof, vibes, and unforgettable moments.',
  'The story everyone asked for, finally here on Azeebo+.',
];

const THUMB = (i) => `/images/placeholders/content/800x450_${String((i % 9) + 1).padStart(2, '0')}.png`;

const TARGET = 30;

function q(s) {
  return `'${String(s).replace(/'/g, "''")}'`;
}

let totalInserted = 0;

for (const u of UNIVERSES) {
  const countRes = PSQL('azeebo_content',
    `SELECT COUNT(*) AS n FROM content_items WHERE "universeId"='${u.id}' AND status='published';`);
  const existing = parseInt(countRes.match(/(\d+)/)?.[1] ?? '0', 10);
  const need = Math.max(0, TARGET - existing);
  if (need === 0) {
    console.log(`${u.name.padEnd(10)} already ${existing} — skipping`);
    continue;
  }

  const titles = TITLES[u.name] ?? [];
  const rows = [];
  for (let i = 0; i < need; i++) {
    const id = `cnt-seed30-${u.name}-${String(i + 1).padStart(3, '0')}`;
    const title = titles[i % titles.length] + (i >= titles.length ? ` Vol.${Math.floor(i / titles.length) + 1}` : '');
    const desc = DESCRIPTIONS[i % DESCRIPTIONS.length];
    const thumb = THUMB(i);
    const creator = CREATORS[i % CREATORS.length];
    const views = 1200 + ((i * 7919 + u.name.length * 131) % 48000);
    rows.push(
      `('${id}', ${q(title)}, ${q(desc)}, ${q(thumb)}, '/videos/${u.name}-${i + 1}.mp4', '${u.id}', '${creator}', 'published', ${views}, NOW(), NOW())`
    );
  }

  PSQL('azeebo_content', `
    INSERT INTO content_items (id, title, description, thumbnail, "mediaUrl", "universeId", "creatorId", status, "viewCount", "createdAt", "updatedAt")
    VALUES ${rows.join(',')}
    ON CONFLICT (id) DO NOTHING;`);

  console.log(`${u.name.padEnd(10)} +${need} (now ${existing + need})`);
  totalInserted += need;
}

console.log(`\nTotal inserted: ${totalInserted}`);
