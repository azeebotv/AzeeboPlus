/**
 * Shared utilities for seed scripts
 */

import { themedArt } from './seed-image-hosts.js';

// ─── Random Helpers ─────────────────────────────────────────────────────────

export function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomItems<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, arr.length));
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

export function randomDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return date;
}

export function randomPastDate(minDaysAgo: number, maxDaysAgo: number): Date {
  const daysAgo = randomInt(minDaysAgo, maxDaysAgo);
  return randomDate(daysAgo);
}

export function futureDate(daysAhead: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date;
}

// ─── ID Generators ──────────────────────────────────────────────────────────

export function generateId(prefix: string, index: number): string {
  return `${prefix}${String(index).padStart(6, '0')}`;
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── Name Generators ────────────────────────────────────────────────────────

const NIGERIAN_FIRST_NAMES = [
  'Adaeze',
  'Chukwuemeka',
  'Ngozi',
  'Oluwaseun',
  'Amina',
  'Emeka',
  'Fatima',
  'Tunde',
  'Chioma',
  'Yusuf',
  'Blessing',
  'Chidi',
  'Halima',
  'Kayode',
  'Ifeoma',
  'Abubakar',
  'Nneka',
  'Oladipo',
  'Zainab',
  'Chinedu',
  'Aisha',
  'Babatunde',
  'Chiamaka',
  'Damilare',
  'Ezinne',
  'Folake',
  'Gbadamosi',
  'Hauwa',
  'Ibrahim',
  'Jumoke',
  'Kemi',
  'Lawal',
  'Maryam',
  'Nkem',
  'Obinna',
  'Petra',
  'Quadri',
  'Rashidat',
  'Suleiman',
  'Titilayo',
];

const NIGERIAN_LAST_NAMES = [
  'Okafor',
  'Adeyemi',
  'Ibrahim',
  'Nnamdi',
  'Bello',
  'Okonkwo',
  'Adekunle',
  'Mohammed',
  'Eze',
  'Olawale',
  'Chukwu',
  'Abdullahi',
  'Obi',
  'Lawal',
  'Ogundimu',
  'Danjuma',
  'Azikiwe',
  'Olumide',
  'Akinwale',
  'Ifeanyi',
];

const USERNAMES = [
  'movieBuff42',
  'comedyKing',
  'musicLover99',
  'naijaPride',
  'streamQueen',
  'afrobeatsFan',
  'nollywoodHead',
  'gamingPro',
  'lifestyleGuru',
  'foodieLagos',
  'techNaija',
  'fashionIcon',
  'fitnessFreak',
  'bookWorm',
  'travelAddict',
  'artCollector',
  'photography101',
  'danceVibes',
  'podcastFan',
  'sportsFanatic',
  'chefSpecial',
  'dancehallKing',
  'rapNaija',
  'soulSister',
  'jazzMan',
  'rockStar',
  'popPrincess',
  'rnbVibes',
  'highlifeKing',
  'fujiMaster',
];

const CITIES = [
  'Lagos',
  'Abuja',
  'Port Harcourt',
  'Ibadan',
  'Kano',
  'Benin City',
  'Kaduna',
  'Enugu',
  'Aba',
  'Ilorin',
  'Warri',
  'Calabar',
  'Jos',
  'Owerri',
];

// Themed art in the universe brand palette (themedArt in seed-image-hosts.ts)
// instead of random photos — dev browse pages should look like the platform.
const AVATARS = Array.from({ length: 10 }, (_, i) => themedArt.avatar(`Seed User ${i + 1}`));

const BANNERS = Array.from({ length: 3 }, (_, i) =>
  themedArt.banner('creator', `Creator Hub ${i + 1}`)
);

const THUMBNAILS = Array.from({ length: 5 }, (_, i) =>
  themedArt.poster('movie', `Feature Presentation ${i + 1}`)
);

export function generateUser(index: number) {
  const firstName = NIGERIAN_FIRST_NAMES[index % NIGERIAN_FIRST_NAMES.length];
  const lastName = NIGERIAN_LAST_NAMES[index % NIGERIAN_LAST_NAMES.length];
  return {
    id: generateId('usr', index),
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@example.com`,
    displayName: `${firstName} ${lastName}`,
    avatar: AVATARS[index % AVATARS.length],
    role: index < 3 ? 'admin' : index < 10 ? 'creator' : 'user',
    city: CITIES[index % CITIES.length],
    username: USERNAMES[index % USERNAMES.length],
    bio: `Passionate about ${randomItem(['music', 'movies', 'comedy', 'lifestyle', 'gaming'])}. Based in ${CITIES[index % CITIES.length]}.`,
  };
}

export function generateThumbnail(index: number): string {
  return THUMBNAILS[index % THUMBNAILS.length];
}

export function generateBanner(index: number): string {
  return BANNERS[index % BANNERS.length];
}

export function generateAvatar(index: number): string {
  return AVATARS[index % AVATARS.length];
}

// ─── Content Data ───────────────────────────────────────────────────────────

const NIGERIAN_MOVIES = [
  'The Wedding Party',
  'Lionheart',
  'October 1',
  'King of Boys',
  'Gbomo Gbomo Express',
  'The Figurine',
  'Ije',
  'Two Brides and a Baby',
  'Telephone',
  'Tango with Me',
  'Half of a Yellow Sun',
  'Dry',
  'The Smart Money Woman',
  'Your Excellency',
  'Love Is Yellow',
  'Cold Feet',
  'Elevator Baby',
  "Okafor's Law",
  'Wives on Strike',
  'Mummy G.O',
  'Brother Jekwu',
  'The Setup',
  'Collision Course',
  'Kambili',
  'Living in Bondage',
  'Rattlesnake',
  'The Ghost and the Twin',
  'Sista',
  'Afamefuna',
];

const AFROBEATS_SONGS = [
  { title: 'Ye', artist: 'Burna Boy' },
  { title: 'Essence', artist: 'Wizkid' },
  { title: 'Last Last', artist: 'Burna Boy' },
  { title: 'Peru', artist: 'Fireboy DML' },
  { title: 'Love Nwantiti', artist: 'CKay' },
  { title: 'Buga', artist: 'Kizz Daniel' },
  { title: 'Calm Down', artist: 'Rema' },
  { title: 'Starboy', artist: 'Wizkid' },
  { title: 'African Queen', artist: '2Baba' },
  { title: 'If', artist: 'Davido' },
  { title: 'Fall', artist: 'Davido' },
  { title: 'Jaho', artist: 'Olamide' },
  { title: 'Owo Blow', artist: 'Olamide' },
  { title: 'Ameno Amapiano', artist: 'Goya Menor' },
  { title: 'Organise', artist: 'Asake' },
  { title: 'Sungba', artist: 'Asake' },
  { title: 'Rush', artist: 'Ayra Starr' },
  { title: 'Bloody Samaritan', artist: 'Ayra Starr' },
  { title: 'Terminator', artist: 'Asake' },
  { title: 'Bandana', artist: 'Asake & Fireboy DML' },
];

const COMEDY_SPECIALS = [
  { title: 'AY Live: Lepacious', comedian: 'AY Makun' },
  { title: 'Bovi Man on Fire', comedian: 'Bovi' },
  { title: 'Basketmouth Cosmic', comedian: 'Basketmouth' },
  { title: 'Okey Bakassi Live', comedian: 'Okey Bakassi' },
  { title: 'I Go Dye Standing', comedian: 'I Go Dye' },
  { title: 'Gordons: No Condition', comedian: 'Gordons' },
  { title: 'Klint Da Drunk Live', comedian: 'Klint Da Drunk' },
  { title: 'CRAZE CLUN: Unfiltered', comedian: 'Craze Clown' },
];

const REALITY_SHOWS = [
  'Big Brother Naija',
  'The Voice Nigeria',
  'Nigerian Idol',
  'Project Fame',
  'Gulder Ultimate Search',
  'The Bachelor Nigeria',
  'Drag Queen Nigeria',
  'Naija Movie Star',
  'Cooking with the Stars',
];

const UNIVERSES = [
  { name: 'movie', displayName: 'Movies & TV', icon: 'Film', color: '#E8420A' },
  { name: 'music', displayName: 'Music', icon: 'Music', color: '#8B5CF6' },
  { name: 'comedy', displayName: 'Comedy', icon: 'Laugh', color: '#F59E0B' },
  { name: 'reality', displayName: 'Reality', icon: 'Tv', color: '#EC4899' },
  { name: 'sports', displayName: 'Sports', icon: 'Trophy', color: '#10B981' },
  { name: 'lifestyle', displayName: 'Lifestyle', icon: 'Heart', color: '#F97316' },
  { name: 'games', displayName: 'Games', icon: 'Gamepad2', color: '#3B82F6' },
  { name: 'creator', displayName: 'Creator Hub', icon: 'Users', color: '#6366F1' },
  { name: 'vertical', displayName: 'Vertical', icon: 'Layers', color: '#14B8A6' },
];

const CATEGORIES = [
  'Action',
  'Romance',
  'Drama',
  'Comedy',
  'Thriller',
  'Horror',
  'Sci-Fi',
  'Afrobeats',
  'Hip-Hop',
  'R&B',
  'Highlife',
  'Fuji',
  'Gospel',
  'Pop',
  'Stand-up',
  'Sketch',
  'Improv',
  'Roast',
  'Observational',
  'Dance',
  'Cooking',
  'Fashion',
  'Travel',
  'Fitness',
  'Beauty',
];

const TAGS = [
  'trending',
  'new-release',
  'exclusive',
  'premium',
  'free',
  'live',
  'nollywood',
  'afrobeats',
  'naija',
  'lagos',
  'abuja',
  'viral',
  'award-winning',
  'blockbuster',
  'classic',
  'original',
  'premiere',
];

export {
  NIGERIAN_MOVIES,
  AFROBEATS_SONGS,
  COMEDY_SPECIALS,
  REALITY_SHOWS,
  UNIVERSES,
  CATEGORIES,
  TAGS,
};

// ─── Print Helpers ──────────────────────────────────────────────────────────

export function printCount(label: string, count: number): void {
  console.log(`  ${label}: ${count}`);
}

export function printHeader(title: string): void {
  console.log(`\n  ┌─ ${title}`);
}

export function printFooter(title: string, count: number): void {
  console.log(`  └─ ${title}: ${count} records`);
}
