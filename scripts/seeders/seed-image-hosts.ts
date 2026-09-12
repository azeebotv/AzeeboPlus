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
  /** Lifestyle-seeder cover art — resolvable, deterministic per slug (600x600 square). */
  musicCover: (slug: string) => seedImageUrl('picsum.photos', `seed/music-${slug}/600/600`),
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
