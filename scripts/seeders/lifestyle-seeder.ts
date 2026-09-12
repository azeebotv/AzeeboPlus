/**
 * Lifestyle Service Seeder (music entries)
 *
 * Seeds published MusicEntry rows across several genres so the music pages
 * render real content end-to-end:
 *   - GET /api/v1/lifestyle/music            (web /music + /lifestyle/music lists)
 *   - GET /api/v1/lifestyle/music?genre=X    (web /music/genres/[slug])
 *   - GET /api/v1/lifestyle/music?artistId=X (web /music/artists/[id])
 *   - GET /api/v1/lifestyle/music/trending   (playCount-ordered)
 *   - GET /api/v1/lifestyle/music/genres/:slug + /artists/:id (detail pages)
 *
 * Design notes:
 *  - Artist and genre identifiers are DERIVED (slugified artistName / genre);
 *    there is no Artist or Genre table, so rows are arranged so every seeded
 *    artist owns multiple tracks within its genre and detail pages aggregate
 *    meaningful stats (trackCount, totalPlays, featured top-3).
 *  - One track is seeded as `draft` to exercise the published-only filter.
 *  - Idempotent: upserts by slug, safe to re-run.
 */

import { printCount } from './utils.js';

const SEED_USER = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'seed@azeebo.test',
  displayName: 'Seed Curator',
  role: 'user',
} as const;

interface SeedTrack {
  title: string;
  slug: string;
  artist: string;
  album: string;
  genre: string;
  duration: number;
  playCount: number;
  isPremium?: boolean;
  status?: 'draft';
  publishedAt: string;
}

const TRACKS: SeedTrack[] = [
  // Afrobeats — Tiwa Sunset
  { title: 'Sunrise in Lekki', slug: 'sunrise-in-lekki', artist: 'Tiwa Sunset', album: 'Lagos Nights', genre: 'Afrobeats', duration: 224, playCount: 84_200, publishedAt: '2026-08-14T09:00:00Z' },
  { title: 'Yellow Sisi', slug: 'yellow-sisi', artist: 'Tiwa Sunset', album: 'Lagos Nights', genre: 'Afrobeats', duration: 198, playCount: 76_100, isPremium: true, publishedAt: '2026-08-21T09:00:00Z' },
  // Amapiano — DJ Kairo
  { title: 'Midnight Log Drums', slug: 'midnight-log-drums', artist: 'DJ Kairo', album: 'Kairo Hours', genre: 'Amapiano', duration: 312, playCount: 65_400, publishedAt: '2026-08-07T09:00:00Z' },
  { title: 'Eko Groove', slug: 'eko-groove', artist: 'DJ Kairo', album: 'Kairo Hours', genre: 'Amapiano', duration: 265, playCount: 58_900, publishedAt: '2026-08-18T09:00:00Z' },
  // Street Hop — Zico Vibe (one draft row exercises the published filter)
  { title: 'Molue Flow', slug: 'molue-flow', artist: 'Zico Vibe', album: 'Street Anthems', genre: 'Street Hop', duration: 189, playCount: 47_200, publishedAt: '2026-08-25T09:00:00Z' },
  { title: 'Backyard Cypher', slug: 'backyard-cypher', artist: 'Zico Vibe', album: 'Street Anthems', genre: 'Street Hop', duration: 205, playCount: 0, status: 'draft', publishedAt: '2026-08-28T09:00:00Z' },
  // Highlife — The Palmwine Boys
  { title: 'Palmwine Serenade', slug: 'palmwine-serenade', artist: 'The Palmwine Boys', album: 'Palmwine Sessions', genre: 'Highlife', duration: 276, playCount: 39_800, publishedAt: '2026-08-03T09:00:00Z' },
  { title: 'Saturday Dance Band', slug: 'saturday-dance-band', artist: 'The Palmwine Boys', album: 'Palmwine Sessions', genre: 'Highlife', duration: 248, playCount: 33_500, publishedAt: '2026-08-11T09:00:00Z' },
  // Alte — Odunsi Grey
  { title: 'Neon Rain', slug: 'neon-rain', artist: 'Odunsi Grey', album: 'Grey Area', genre: 'Alte', duration: 231, playCount: 28_700, publishedAt: '2026-08-16T09:00:00Z' },
  { title: 'Static Hearts', slug: 'static-hearts', artist: 'Odunsi Grey', album: 'Grey Area', genre: 'Alte', duration: 199, playCount: 21_400, publishedAt: '2026-08-23T09:00:00Z' },
  // Gospel — Ada Melody
  { title: 'Morning Grace', slug: 'morning-grace', artist: 'Ada Melody', album: 'Grateful', genre: 'Gospel', duration: 289, playCount: 19_300, publishedAt: '2026-08-05T09:00:00Z' },
  { title: 'Hallel Chant', slug: 'hallel-chant', artist: 'Ada Melody', album: 'Grateful', genre: 'Gospel', duration: 262, playCount: 12_700, publishedAt: '2026-08-19T09:00:00Z' },
  // ── Wave 2: fill albums to 2+ tracks, add a Fuji artist/genre ──
  { title: 'Lagoon Breeze', slug: 'lagoon-breeze', artist: 'Tiwa Sunset', album: 'Neon Lagos', genre: 'Afrobeats', duration: 214, playCount: 41_800, publishedAt: '2026-08-30T09:00:00Z' },
  { title: 'Danfo Rhythm', slug: 'danfo-rhythm', artist: 'Tiwa Sunset', album: 'Lagos Nights', genre: 'Afrobeats', duration: 236, playCount: 38_400, isPremium: true, publishedAt: '2026-09-01T09:00:00Z' },
  { title: 'Soweto Twilight', slug: 'soweto-twilight', artist: 'DJ Kairo', album: 'Amapiano Nights', genre: 'Amapiano', duration: 341, playCount: 35_100, publishedAt: '2026-08-31T09:00:00Z' },
  { title: 'Private School Piano', slug: 'private-school-piano', artist: 'DJ Kairo', album: 'Kairo Hours', genre: 'Amapiano', duration: 298, playCount: 31_600, publishedAt: '2026-09-02T09:00:00Z' },
  { title: 'Ojota Anthem', slug: 'ojota-anthem', artist: 'Zico Vibe', album: 'Street Anthems', genre: 'Street Hop', duration: 217, playCount: 26_900, publishedAt: '2026-09-03T09:00:00Z' },
  { title: 'Bariga Nights', slug: 'bariga-nights', artist: 'Zico Vibe', album: 'Bariga Nights', genre: 'Street Hop', duration: 194, playCount: 22_300, publishedAt: '2026-09-04T09:00:00Z' },
  { title: 'Guitar Boy Special', slug: 'guitar-boy-special', artist: 'The Palmwine Boys', album: 'Market Sounds', genre: 'Highlife', duration: 284, playCount: 17_800, publishedAt: '2026-08-29T09:00:00Z' },
  { title: 'Retro Futurist', slug: 'retro-futurist', artist: 'Odunsi Grey', album: 'Alte Tapes', genre: 'Alte', duration: 226, playCount: 14_900, publishedAt: '2026-09-05T09:00:00Z' },
  { title: 'Testimony Time', slug: 'testimony-time', artist: 'Ada Melody', album: 'Higher Ground', genre: 'Gospel', duration: 271, playCount: 9_600, publishedAt: '2026-09-06T09:00:00Z' },
  // Fuji — new artist Alhaji Stereo
  { title: 'Mushin Mornings', slug: 'mushin-mornings', artist: 'Alhaji Stereo', album: 'Mushin Mornings', genre: 'Fuji', duration: 322, playCount: 11_200, publishedAt: '2026-09-04T11:00:00Z' },
  { title: 'Ramadan Refrain', slug: 'ramadan-refrain', artist: 'Alhaji Stereo', album: 'Mushin Mornings', genre: 'Fuji', duration: 305, playCount: 8_100, publishedAt: '2026-09-06T11:00:00Z' },
];

let PrismaClient: new (args?: unknown) => unknown;

async function getClient() {
  try {
    const mod = await import(
      '../../services/universes/lifestyle-service/src/prisma/client/index.js'
    );
    PrismaClient = mod.PrismaClient;
  } catch {
    const mod = await import('@prisma/client');
    PrismaClient = mod.PrismaClient;
  }
  return new (PrismaClient as new () => {
    user: {
      upsert: (args: unknown) => Promise<{ id: string }>;
    };
    musicEntry: {
      upsert: (args: unknown) => Promise<{ id: string }>;
      count: (args?: unknown) => Promise<number>;
    };
    $disconnect: () => Promise<void>;
  })();
}

export async function seedLifestyleService(dryRun = false): Promise<number> {
  const publishedCount = TRACKS.filter((t) => t.status !== 'draft').length;
  if (dryRun) {
    console.log(
      `  [DRY RUN] Would upsert seed user + ${TRACKS.length} music entries ` +
        `(${publishedCount} published, ${TRACKS.length - publishedCount} draft)`
    );
    return TRACKS.length;
  }

  const prisma = await getClient();
  try {
    await prisma.user.upsert({
      where: { id: SEED_USER.id },
      create: { ...SEED_USER },
      update: {},
    });

    printCount('Music Entries', TRACKS.length);
    for (const track of TRACKS) {
      const content = {
        title: track.title,
        type: 'track',
        description: `${track.genre} record by ${track.artist} — from the album ${track.album}.`,
        coverImage: `https://cdn.azeebo.test/music/${track.slug}.jpg`,
        artistName: track.artist,
        albumName: track.album,
        duration: track.duration,
        genre: track.genre,
        trackUrl: `https://cdn.azeebo.test/music/${track.slug}.mp3`,
        isPremium: track.isPremium ?? false,
        playCount: track.playCount,
        status: track.status ?? 'published',
        publishedAt: new Date(track.publishedAt),
      };
      await prisma.musicEntry.upsert({
        where: { slug: track.slug },
        create: { ...content, slug: track.slug, createdById: SEED_USER.id },
        update: content,
      });
    }

    const total = await prisma.musicEntry.count();
    const published = await prisma.musicEntry.count({ where: { status: 'published' } });
    console.log(`  → lifestyle music: ${published} published / ${total} total rows`);

    // NOTE: lifestyle-service also holds a ~30s in-process response cache, so a
    // running instance serves fully fresh lists shortly after this finishes.
    return total;
  } finally {
    await prisma.$disconnect();
  }
}

// Allow standalone execution: pnpm tsx scripts/seeders/lifestyle-seeder.ts
if (
  process.argv[1]?.endsWith('lifestyle-seeder.ts') ||
  process.argv[1]?.endsWith('lifestyle-seeder.js')
) {
  const dryRun = process.argv.includes('--dry-run');
  seedLifestyleService(dryRun)
    .then((count) => {
      console.log(`✓ lifestyle seeder ${dryRun ? '(dry run)' : 'complete'}: ${count} music rows`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('✗ lifestyle seeder failed:', error);
      process.exit(1);
    });
}
