/* eslint-disable @typescript-eslint/no-require-imports */

/** In-memory AsyncStorage mock — shared across all specs in this file. */
const mockStore = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (key: string) => mockStore.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      mockStore.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      mockStore.delete(key);
    }),
    getAllKeys: jest.fn(async () => Array.from(mockStore.keys())),
  },
}));

jest.mock('../logger', () => ({
  logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { mediaCache, mediaFingerprint, policyTtlMs } from '../mediaCache';
import type { MediaUploadResponse } from '../../api/media';

beforeEach(() => {
  mockStore.clear();
  jest.clearAllMocks();
});

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('policyTtlMs', () => {
  it('returns null for immutable', () => {
    expect(policyTtlMs('immutable')).toBeNull();
  });

  it('returns 7 days for long-lived', () => {
    expect(policyTtlMs('long-lived')).toBe(7 * DAY);
  });

  it('returns 1 day for medium-lived', () => {
    expect(policyTtlMs('medium-lived')).toBe(DAY);
  });

  it('returns 1 hour for short-lived', () => {
    expect(policyTtlMs('short-lived')).toBe(HOUR);
  });

  it('returns 0 for no-store', () => {
    expect(policyTtlMs('no-store')).toBe(0);
  });

  it('returns 0 for undefined policy', () => {
    expect(policyTtlMs(undefined)).toBe(0);
  });
});

describe('mediaFingerprint', () => {
  it('joins type, name, and size', () => {
    expect(mediaFingerprint({ type: 'image/jpeg', name: 'photo.jpg', size: 1024 })).toBe(
      'image/jpeg|photo.jpg|1024'
    );
  });

  it('handles missing size', () => {
    expect(mediaFingerprint({ type: 'image/jpeg', name: 'photo.jpg' })).toBe(
      'image/jpeg|photo.jpg|'
    );
  });
});

describe('upload registry (immutable skip)', () => {
  const fp = 'image/jpeg|avatar.jpg|5000';

  it('returns null when nothing is cached', async () => {
    const result = await mediaCache.getImmutableUpload(fp);
    expect(result).toBeNull();
  });

  it('serves the cached response for immutable policy', async () => {
    const response: MediaUploadResponse = {
      key: 'k1',
      url: 'https://cdn.example.com/k1',
      cdnUrl: 'https://cdn.example.com/k1',
      filename: 'avatar.jpg',
      mimetype: 'image/jpeg',
      size: 5000,
      cacheControl: 'public, max-age=31536000, immutable',
      cachePolicy: 'immutable',
    };
    await mediaCache.rememberUpload(fp, response);

    const cached = await mediaCache.getImmutableUpload(fp);
    expect(cached).not.toBeNull();
    expect(cached!.key).toBe('k1');
    expect(cached!.cachePolicy).toBe('immutable');
  });

  it('returns null for non-immutable policies — no skip', async () => {
    const response: MediaUploadResponse = {
      key: 'k2',
      url: 'https://cdn.example.com/k2',
      cdnUrl: 'https://cdn.example.com/k2',
      filename: 'clip.mp4',
      mimetype: 'video/mp4',
      size: 10_000_000,
      cacheControl: 'public, max-age=86400',
      cachePolicy: 'medium-lived',
    };
    await mediaCache.rememberUpload(fp, response);

    const cached = await mediaCache.getImmutableUpload(fp);
    expect(cached).toBeNull();
  });

  it('overwrites a previous record on re-remember', async () => {
    const mutable: MediaUploadResponse = {
      key: 'm1',
      url: 'https://cdn.example.com/m1',
      cdnUrl: 'https://cdn.example.com/m1',
      filename: 'old.mp4',
      mimetype: 'video/mp4',
      size: 100,
      cachePolicy: 'short-lived',
    };
    await mediaCache.rememberUpload(fp, mutable);
    expect(await mediaCache.getImmutableUpload(fp)).toBeNull();

    // Same fingerprint, now immutable — the old non-immutable record is gone.
    const immutable: MediaUploadResponse = {
      key: 'i1',
      url: 'https://cdn.example.com/i1',
      cdnUrl: 'https://cdn.example.com/i1',
      filename: 'img.jpg',
      mimetype: 'image/jpeg',
      size: 100,
      cachePolicy: 'immutable',
    };
    await mediaCache.rememberUpload(fp, immutable);
    const cached = await mediaCache.getImmutableUpload(fp);
    expect(cached!.key).toBe('i1');
  });

  it('clearUpload removes the record', async () => {
    await mediaCache.rememberUpload(fp, {
      key: 'k',
      url: 'u',
      cdnUrl: 'u',
      filename: 'f',
      mimetype: 'image/jpeg',
      size: 1,
      cachePolicy: 'immutable',
    });
    await mediaCache.clearUpload(fp);
    expect(await mediaCache.getImmutableUpload(fp)).toBeNull();
  });
});

describe('signed-URL cache (revalidate-after-TTL)', () => {
  const key = 'uploads/img/profile.jpg';

  it('returns null when nothing is cached', async () => {
    const cached = await mediaCache.getCachedSignedUrl(key, 'short-lived');
    expect(cached).toBeNull();
  });

  it('serves a fresh entry within the policy TTL', async () => {
    await mediaCache.rememberSignedUrl(key, 'short-lived', 'https://signed.url/1', 3600);

    const cached = await mediaCache.getCachedSignedUrl(key, 'short-lived');
    expect(cached).not.toBeNull();
    expect(cached!.url).toBe('https://signed.url/1');
  });

  it('returns null when the policy TTL has elapsed', async () => {
    // Stash a record with a cachedAt well past the short-lived TTL (1h).
    const past = Date.now() - 2 * HOUR;
    await AsyncStorage.setItem(
      `media_signed_url_${key}`,
      JSON.stringify({ url: 'https://old.url', expiresIn: 3600, cachedAt: past })
    );

    const cached = await mediaCache.getCachedSignedUrl(key, 'short-lived');
    expect(cached).toBeNull();
  });

  it('returns null when the server-side URL has expired', async () => {
    // expiresIn is 1s; cachedAt is 2s ago → the URL is stale on the server.
    const past = Date.now() - 2000;
    await AsyncStorage.setItem(
      `media_signed_url_${key}`,
      JSON.stringify({ url: 'https://expired.url', expiresIn: 1, cachedAt: past })
    );

    const cached = await mediaCache.getCachedSignedUrl(key, 'short-lived');
    expect(cached).toBeNull();
  });

  it('serves an immutable entry regardless of age', async () => {
    const immutableKey = 'uploads/img/banner.jpg';
    const past = Date.now() - 100 * DAY;
    await AsyncStorage.setItem(
      `media_signed_url_${immutableKey}`,
      JSON.stringify({ url: 'https://forever.url', expiresIn: 31536000, cachedAt: past })
    );

    const cached = await mediaCache.getCachedSignedUrl(immutableKey, 'immutable');
    expect(cached).not.toBeNull();
    expect(cached!.url).toBe('https://forever.url');
  });

  it('never persists no-store entries', async () => {
    await mediaCache.rememberSignedUrl(key, 'no-store', 'https://noop.url', 3600);
    // AsyncStorage should not have been called for a no-store policy.
    const stored = await AsyncStorage.getItem(`media_signed_url_${key}`);
    expect(stored).toBeNull();
  });

  it('returns the same entry for the same key regardless of policy band when fresh', async () => {
    // Store with medium-lived policy.
    await mediaCache.rememberSignedUrl(key, 'medium-lived', 'https://media.url', 3600);
    // Read with long-lived — the entry is the same, and both bands permit it.
    const cached = await mediaCache.getCachedSignedUrl(key, 'long-lived');
    expect(cached!.url).toBe('https://media.url');
  });
});

describe('clear', () => {
  it('removes all upload and signed-URL entries', async () => {
    await mediaCache.rememberUpload('fp1', {
      key: 'k1', url: 'u', cdnUrl: 'u', filename: 'f', mimetype: 'image/jpeg', size: 1,
      cachePolicy: 'immutable',
    });
    await mediaCache.rememberSignedUrl('sk1', 'short-lived', 'https://u', 3600);
    expect(mockStore.size).toBeGreaterThan(0);

    await mediaCache.clear();
    expect(mockStore.size).toBe(0);
  });
});