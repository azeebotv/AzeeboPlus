/**
 * Single source of truth for every external image/media host the seeders
 * emit, and the only sanctioned way for a seeder to build a media URL.
 *
 * WHY THIS EXISTS
 * ---------------
 * Seeder URLs land in the database and flow into `next/image` render paths
 * (ContentCard, OptimizedImage, ...). Next's image optimizer refuses any
 * host not listed in `apps/web/next.config.js` → `images.remotePatterns`,
 * so a seeder that invents a URL crashes the web app at runtime. That
 * happened with `cdn.azeebo.test` (lifestyle-seeder music covers) and was
 * fixed by hand-editing the allowlist — which only works while every host
 * is traceable. This module makes the trace mechanical:
 *
 *   1. Every seeder builds media URLs through `seedImageUrl()` / `seedImages`.
 *   2. Every host here MUST be in the web allowlist — CI enforces it
 *      (scripts/check-seed-image-hosts.mjs → `pnpm run check:seed-image-hosts`),
 *      so adding a host to this file without allowlisting it fails the PR,
 *      and a seeder bypassing this module fails the PR too.
 *
 * Hosts that previously emitted non-allowlisted placeholders
 * (images.unsplash.com, api.dicebear.com) were migrated to the
 * already-allowlisted picsum.photos — placeholder for placeholder — so the
 * invariant stays absolute: no exception list, every module host is
 * renderable through next/image.
 *
 * NOTE: social profile links (e.g. instagram.com) are NOT media URLs — they
 * are hyperlinks, never fetched by the image optimizer — and are exempted in
 * the check rather than routed through here.
 */

/** Hostname → what the seeders use it for (kept in sync with the allowlist by CI). */
export const SEED_IMAGE_HOSTS = {
  // Lifestyle-seeder track AUDIO (media download, not next/image input).
  // Test TLD — resolves only in dev environments; covers moved to picsum
  // (resolvable) so dev music pages don't render broken art.
  'cdn.azeebo.test': 'lifestyle-seeder track audio (not optimizer input)',
  // Creator/content media + thumbnails (seed-creators.ts, content-seeder.ts).
  'storage.azeebo.com': 'creator + content media and thumbnails',
  // Generic deterministic placeholders (avatars, banners, thumbnails, art).
  'picsum.photos': 'deterministic placeholder images',
} as const;

export type SeedImageHost = keyof typeof SEED_IMAGE_HOSTS;

/**
 * Build a media URL for a registered seed host. Throws on unknown hosts so a
 * typo or an unregistered host fails the seeder immediately instead of
 * failing the web app at render time.
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

/** Ready-made builders for the URL shapes the seeders actually emit. */
export const seedImages = {
  /** Lifestyle-seeder cover art — themed, deterministic per title (600x600 square). */
  musicCover: (title: string) => themedArt.cover('music', title),
  /** Lifestyle-seeder audio track media. */
  musicTrack: (slug: string) => seedImageUrl('cdn.azeebo.test', `music/${slug}.mp3`),
  /** Content-service media files (grouped by content type). */
  storageMedia: (type: string, file: string) =>
    seedImageUrl('storage.azeebo.com', `${type}/${file}`),
  /** Creator thumbnail images. */
  storageThumbnail: (id: number | string) =>
    seedImageUrl('storage.azeebo.com', `thumbnails/${id}.jpg`),
  /** Deterministic picsum placeholder seeded by any string (title, email, ...). */
  picsum: (seed: string, width: number, height: number) =>
    seedImageUrl('picsum.photos', `seed/${encodeURIComponent(seed)}/${width}/${height}`),
} as const;

/* -------------------------------------------------------------------------
 * Themed per-universe seed art
 * -------------------------------------------------------------------------
 * Random photos (picsum) make dev browse pages look like a stock-photo site.
 * These builders render per-universe THEMED art instead: the universe's brand
 * color (same palette as UNIVERSES in seeders/utils.ts — keep in sync) with
 * the universe name and the content title as readable text, via the already
 * allowlisted placehold.co / ui-avatars.com — so the host invariant stays
 * absolute: every emitted host is renderable through next/image.
 */

export const UNIVERSE_THEMES = {
  movie: { label: 'MOVIES & TV', bg: 'E8420A', fg: 'FFF7ED' },
  music: { label: 'MUSIC', bg: '8B5CF6', fg: 'F5F3FF' },
  comedy: { label: 'COMEDY', bg: 'F59E0B', fg: 'FFFBEB' },
  reality: { label: 'REALITY', bg: 'EC4899', fg: 'FDF2F8' },
  sports: { label: 'SPORTS', bg: '10B981', fg: 'ECFDF5' },
  lifestyle: { label: 'LIFESTYLE', bg: 'F97316', fg: 'FFF7ED' },
  games: { label: 'GAMES', bg: '3B82F6', fg: 'EFF6FF' },
  creator: { label: 'CREATOR HUB', bg: '6366F1', fg: 'EEF2FF' },
  vertical: { label: 'VERTICAL', bg: '14B8A6', fg: 'F0FDFA' },
  /** Neutral fallback for content outside the nine branded universes. */
  user: { label: 'AZEEBO+', bg: '18151E', fg: 'F5F3FF' },
} as const;

export type UniverseTheme = keyof typeof UNIVERSE_THEMES;

function themeFor(universe: string) {
  return UNIVERSE_THEMES[universe as UniverseTheme] ?? UNIVERSE_THEMES.user;
}

/** placehold.co card: universe label on top, title beneath, brand palette. */
function placeholdCard(width: number, height: number, universe: string, title: string) {
  const theme = themeFor(universe);
  const titleLine =
    title
      .toUpperCase()
      .replace(/[^A-Z0-9+ ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 60) || 'AZEEBO+';
  const text = encodeURIComponent([theme.label, titleLine].join('\n'));
  return `https://placehold.co/${width}x${height}/${theme.bg}/${theme.fg}/png?text=${text}`;
}

/** ui-avatars initials chip in the neutral brand palette. */
function initialsAvatar(name: string) {
  const theme = UNIVERSE_THEMES.user;
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .replace(/[^A-Z]/g, '') || 'AZ';
  const params = new URLSearchParams({
    name: initials,
    size: '200',
    background: theme.bg,
    color: theme.fg,
    bold: 'true',
    length: '2',
  });
  return `https://ui-avatars.com/api/?${params.toString()}`;
}

/** Themed art builders, shaped for how seeders actually use them. */
export const themedArt = {
  /** Portrait card — movies, series, specials. */
  poster: (universe: string, title: string) => placeholdCard(400, 600, universe, title),
  /** Square card — music, games. */
  cover: (universe: string, title: string) => placeholdCard(400, 400, universe, title),
  /** Landscape card — lifestyle, news-style rows. */
  wide: (universe: string, title: string) => placeholdCard(400, 300, universe, title),
  /** Creator/profile banner strip. */
  banner: (universe: string, title: string) => placeholdCard(1200, 400, universe, title),
  /** Deterministic initials avatar. */
  avatar: (name: string) => initialsAvatar(name),
} as const;
