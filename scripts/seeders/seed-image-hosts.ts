/**
 * Single source of truth for every external image/media host the seeders
 * emit, and the only sanctioned way for a seeder to build a media URL.
 *
 * WHY THIS EXISTS
 * ---------------
 * Seeder URLs land in the database and flow into `next/image` render paths
 * (ContentCard, OptimizedImage, ...). Next's image optimizer refuses any
 * host not listed in `apps/web/next.config.js` → `images.remotePatterns`,
 * so a seeder that invents a URL crashes the web app at runtime.
 *
 *   1. Every seeder builds media URLs through `seedImageUrl()` / `seedImages`.
 *   2. Every host here MUST be in the web allowlist — CI enforces it
 *      (scripts/check-seed-image-hosts.mjs → `pnpm run check:seed-image-hosts`).
 */

/** Hostname → what the seeders use it for (kept in sync with the allowlist by CI). */
export const SEED_IMAGE_HOSTS = {
  // Lifestyle-seeder track AUDIO (media download, not next/image input).
  'cdn.azeebo.test': 'lifestyle-seeder track audio (not optimizer input)',
  // Creator/content media + thumbnails (seed-creators.ts, content-seeder.ts).
  'storage.azeebo.com': 'creator + content media and thumbnails',
  // Generic deterministic placeholders.
  'picsum.photos': 'deterministic placeholder images',
  // High-resolution real photography and editorial media across all universes.
  'images.unsplash.com': 'high-resolution editorial media and thumbnails',
} as const;

export type SeedImageHost = keyof typeof SEED_IMAGE_HOSTS;

/**
 * Build a media URL for a registered seed host. Throws on unknown hosts so a
 * typo or an unregistered host fails the seeder immediately.
 */
export function seedImageUrl(host: SeedImageHost, path: string): string {
  if (!Object.prototype.hasOwnProperty.call(SEED_IMAGE_HOSTS, host)) {
    const known = Object.keys(SEED_IMAGE_HOSTS).join(', ');
    throw new Error(
      `Unknown seed image host "${host}". Add it to SEED_IMAGE_HOSTS (scripts/seeders/seed-image-hosts.ts) ` +
        `AND apps/web/next.config.js images.remotePatterns — or use one of the registered hosts: ${known}`
    );
  }
  return `https://${host}/${path.replace(/^\/+/, '')}`;
}

/* -------------------------------------------------------------------------
 * Real Curated High-Definition Imagery per Universe (Unsplash)
 * -------------------------------------------------------------------------
 * High quality photography curated for each African entertainment genre.
 */

const REAL_PHOTO_GALLERY: Record<string, string[]> = {
  movie: [
    'photo-1536440136628-849c177e76a1',
    'photo-1485846234645-a62644f84728',
    'photo-1478720568477-152d9b164e26',
    'photo-1518676599649-7c77c68b753a',
    'photo-1594909122845-11baa439b7bf',
    'photo-1574267432553-4b4628081c31',
    'photo-1517604931442-7e0c8ed2963c',
    'photo-1509281373149-e957c6296406',
  ],
  movies: [
    'photo-1536440136628-849c177e76a1',
    'photo-1485846234645-a62644f84728',
    'photo-1478720568477-152d9b164e26',
    'photo-1518676599649-7c77c68b753a',
    'photo-1594909122845-11baa439b7bf',
    'photo-1574267432553-4b4628081c31',
    'photo-1517604931442-7e0c8ed2963c',
    'photo-1509281373149-e957c6296406',
  ],
  reality: [
    'photo-1516450360452-9312f5e86fc7',
    'photo-1492684223066-81342ee5ff30',
    'photo-1514525253161-7a46d19cd819',
    'photo-1501386761578-eac5c94b800a',
    'photo-1520523839898-507127027d86',
    'photo-1524368535928-5b5e00ddc76b',
    'photo-1512917774080-9991f1c4c750',
    'photo-1534528741775-53994a69daeb',
  ],
  music: [
    'photo-1511671782779-c97d3d27a1d4',
    'photo-1470225620780-dba8ba36b745',
    'photo-1514525253161-7a46d19cd819',
    'photo-1508700115892-45ecd05ae2ad',
    'photo-1465847899084-d164df4dedc6',
    'photo-1511735111819-9a3f7709049c',
    'photo-1520523839898-507127027d86',
  ],
  comedy: [
    'photo-1585699324551-f6c309eedeca',
    'photo-1527224857830-43a7acc85260',
    'photo-1516450360452-9312f5e86fc7',
    'photo-1507676184212-d03ab07a01bf',
    'photo-1514525253161-7a46d19cd819',
  ],
  sports: [
    'photo-1508098682722-e99c43a406b2',
    'photo-1574629810360-7efbbe195018',
    'photo-1517649763962-0c623266ddc0',
    'photo-1431324155629-1a6deb1dec8d',
    'photo-1560272564-c83b66b1ad12',
    'photo-1522778119026-d647f0596c20',
  ],
  lifestyle: [
    'photo-1507525428034-b723cf961d3e',
    'photo-1512917774080-9991f1c4c750',
    'photo-1517248135467-4c7edcad34c4',
    'photo-1492684223066-81342ee5ff30',
    'photo-1506157786151-b8491531f063',
    'photo-1518173946687-a4c8a383392e',
  ],
  games: [
    'photo-1542751371-adc38448a05e',
    'photo-1511512578047-dfb367046420',
    'photo-1538481199705-c710c4e965fc',
    'photo-1550745165-9bc0b252726f',
    'photo-1612287233284-a131b78297ea',
  ],
  creator: [
    'photo-1518173946687-a4c8a383392e',
    'photo-1598488035139-bdbb2231ce04',
    'photo-1574717024653-61fd2cf4d44d',
    'photo-1516321318423-f06f85e504b3',
    'photo-1522202176988-66273c2fd55f',
  ],
  vertical: [
    'photo-1534528741775-53994a69daeb',
    'photo-1507003211169-0a1dd7228f2d',
    'photo-1500648767791-00dcc994a43e',
    'photo-1494790108377-be9c29b29330',
    'photo-1512917774080-9991f1c4c750',
  ],
  'live-event': [
    'photo-1514525253161-7a46d19cd819',
    'photo-1492684223066-81342ee5ff30',
    'photo-1501386761578-eac5c94b800a',
    'photo-1516450360452-9312f5e86fc7',
  ],
  avatars: [
    'photo-1534528741775-53994a69daeb',
    'photo-1507003211169-0a1dd7228f2d',
    'photo-1517841905240-472988babdf9',
    'photo-1500648767791-00dcc994a43e',
    'photo-1494790108377-be9c29b29330',
    'photo-1506794778202-cad84cf45f1d',
    'photo-1524504388940-b1c1722653e1',
    'photo-1519085360753-af0119f7cbe7',
    'photo-1544005313-94ddf0286df2',
    'photo-1501196354995-cbb51c65aaea',
  ],
};

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function getPhoto(universe: string, seed: string): string {
  const normKey = universe.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const pool = REAL_PHOTO_GALLERY[normKey] ?? REAL_PHOTO_GALLERY.movie;
  const idx = hashString(seed) % pool.length;
  return pool[idx];
}

function unsplashCard(photoId: string, width: number, height: number): string {
  const cleanId = photoId.split('?')[0].replace(/^\/+/, '');
  return `${seedImageUrl('images.unsplash.com', cleanId)}?auto=format&fit=crop&w=${width}&h=${height}&q=80`;
}

/** Ready-made builders for the URL shapes the seeders emit. */
export const seedImages = {
  /** Lifestyle-seeder cover art — real photography per title (600x600 square). */
  musicCover: (title: string) => themedArt.cover('music', title),
  /** Lifestyle-seeder audio track media. */
  musicTrack: (slug: string) => seedImageUrl('cdn.azeebo.test', `music/${slug}.mp3`),
  /** Content-service media files (grouped by content type). */
  storageMedia: (type: string, file: string) =>
    seedImageUrl('storage.azeebo.com', `${type}/${file}`),
  /** Creator thumbnail images. */
  storageThumbnail: (id: number | string) =>
    seedImageUrl('storage.azeebo.com', `thumbnails/${id}.jpg`),
  /** Real Unsplash editorial image builder. */
  unsplash: (photoId: string, width = 800, height?: number) => {
    const cleanId = photoId.split('?')[0].replace(/^\/+/, '');
    const hParam = height ? `&h=${height}` : '';
    return `${seedImageUrl('images.unsplash.com', cleanId)}?auto=format&fit=crop&w=${width}${hParam}&q=80`;
  },
  /** Deterministic picsum placeholder seeded by any string. */
  picsum: (seed: string, width: number, height: number) =>
    seedImageUrl('picsum.photos', `seed/${encodeURIComponent(seed)}/${width}/${height}`),
} as const;

/** Real cinematic and photographic art builders. */
export const themedArt = {
  /** Portrait card — movies, series, specials (400x600). */
  poster: (universe: string, title: string) => {
    const photoId = getPhoto(universe, title);
    return unsplashCard(photoId, 400, 600);
  },
  /** Square card — music, games (600x600). */
  cover: (universe: string, title: string) => {
    const photoId = getPhoto(universe, title);
    return unsplashCard(photoId, 600, 600);
  },
  /** Landscape card — lifestyle, episodes, clips, highlights (800x450). */
  wide: (universe: string, title: string) => {
    const photoId = getPhoto(universe, title);
    return unsplashCard(photoId, 800, 450);
  },
  /** Creator/profile/billboard banner strip (1600x600). */
  banner: (universe: string, title: string) => {
    const photoId = getPhoto(universe, title);
    return unsplashCard(photoId, 1600, 600);
  },
  /** Real portrait avatar for creators, contestants, and users (300x300). */
  avatar: (name: string) => {
    const pool = REAL_PHOTO_GALLERY.avatars;
    const idx = hashString(name) % pool.length;
    return unsplashCard(pool[idx], 300, 300);
  },
} as const;
