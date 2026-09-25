/**
 * Shared music contract helpers for the mobile app.
 *
 * The lifestyle-service music endpoints return raw `MusicEntry` rows
 * (artistName/coverImage/duration-seconds) inside `{ success, data }`
 * envelopes, with some lists wrapped in a paginated `{ items, ... }`
 * object. This mirrors apps/web/src/lib/music.ts so both platforms
 * render the same normalized shape.
 */
export interface MusicEntry {
  id: string;
  title: string;
  slug?: string;
  type?: string;
  description?: string;
  coverImage?: string;
  artistName?: string;
  albumName?: string;
  duration?: number;
  genre?: string;
  trackUrl?: string;
  isPremium?: boolean;
  playCount?: number;
  status?: string;
  publishedAt?: string;
  createdAt?: string;
}

export interface NormalizedTrack {
  id: string;
  title: string;
  artist: string;
  /** Slugified artist name — matches lifestyle-service artist ids. */
  artistId?: string;
  thumbnail: string;
  duration?: number;
  genre?: string;
  album?: string;
  audioUrl?: string;
  playCount?: number;
}

export interface NormalizedGenre {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

/** Slugify identically to MusicService.slugify so artist links resolve. */
export function slugifyArtist(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function normalizeTrack(entry: MusicEntry): NormalizedTrack {
  return {
    id: entry.id,
    title: entry.title,
    artist: entry.artistName ?? '',
    artistId: entry.artistName ? slugifyArtist(entry.artistName) : undefined,
    thumbnail: entry.coverImage ?? '',
    duration: entry.duration,
    genre: entry.genre,
    album: entry.albumName,
    audioUrl: entry.trackUrl,
    playCount: entry.playCount,
  };
}

/**
 * Extract `NormalizedTrack[]` from any shape the music API returns:
 *  - `{ success, data: { items: [...] } }` paginated list
 *  - `{ success, data: [...] }` bare array
 *  - `{ success, data: { ...entry } }` single entry
 */
export function extractTracks(response: unknown): NormalizedTrack[] {
  const data =
    response && typeof response === 'object' && 'data' in response
      ? (response as { data: unknown }).data
      : response;

  if (Array.isArray(data)) return data.map(normalizeTrack);
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.items)) {
      return (obj.items as MusicEntry[]).map(normalizeTrack);
    }
    if (obj.id && obj.title) return [normalizeTrack(obj as unknown as MusicEntry)];
  }
  return [];
}

/**
 * Extract genres from `{ success, data: { genres: string[] } }` (service
 * shape) into `{ id, name, slug }` chips, tolerating richer shapes.
 */
export function extractGenres(response: unknown): NormalizedGenre[] {
  let data: unknown = response;
  if (response && typeof response === 'object' && 'data' in response) {
    data = (response as { data: unknown }).data;
  }
  if (data && typeof data === 'object') {
    if (Array.isArray((data as { genres?: unknown }).genres)) {
      const list = (data as { genres: unknown[] }).genres;
      const out: NormalizedGenre[] = [];
      for (const g of list) {
        if (typeof g === 'string') {
          out.push({ id: g, name: g, slug: slugifyArtist(g), icon: '🎶' });
          continue;
        }
        const obj = g as { name?: string; slug?: string; id?: string; icon?: string };
        if (obj && (obj.name || obj.slug)) {
          const name = obj.name ?? obj.slug ?? '';
          out.push({
            id: obj.id ?? name,
            name,
            slug: obj.slug ?? slugifyArtist(name),
            icon: obj.icon ?? '🎶',
          });
        }
      }
      return out;
    }
    if (Array.isArray(data)) {
      const out: NormalizedGenre[] = [];
      for (const g of data) {
        const obj = g as { name?: string; slug?: string; id?: string; icon?: string };
        const name = obj?.name ?? obj?.slug ?? '';
        if (name) {
          out.push({
            id: obj.id ?? name,
            name,
            slug: obj.slug ?? slugifyArtist(name),
            icon: obj.icon ?? '🎶',
          });
        }
      }
      return out;
    }
  }
  return [];
}
