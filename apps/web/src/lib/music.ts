import type { Track } from '@/components/music/MusicTrackList';

/**
 * Raw entry shape returned by the lifestyle-service music endpoints.
 * Field names differ from the web `Track` shape (artistName/coverImage).
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

export interface MusicGenre {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  trackCount?: number;
}

/**
 * Slugify an artist name the same way lifestyle-service derives artist ids
 * (see MusicService.slugify) so track → artist deep links resolve.
 */
function slugifyArtist(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function normalizeTrack(entry: MusicEntry): Track {
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
 * Extract a `Track[]` from any shape the music API returns:
 *  - paginated list: `{ items: MusicEntry[], total, page, ... }`
 *  - bare array: `MusicEntry[]`
 *  - single entry: `MusicEntry`
 */
export function extractTracks(data: unknown): Track[] {
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
 * Extract genres from `{ genres: string[] }` into `{ id, name, slug }`
 * objects the web pages render as chips/cards.
 */
export function extractGenres(data: unknown): MusicGenre[] {
  if (data && typeof data === 'object') {
    const genres = (data as { genres?: unknown }).genres;
    if (Array.isArray(genres)) {
      return genres
        .filter((genre): genre is string => typeof genre === 'string')
        .map((name) => ({ id: name, name, slug: name.toLowerCase() }));
    }
  }
  return [];
}
