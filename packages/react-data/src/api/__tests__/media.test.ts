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

jest.mock('../client', () => ({
  apiClient: {
    getBaseURL: jest.fn(() => 'http://test.local'),
    getToken: jest.fn(() => null),
    get: jest.fn(),
  },
}));

jest.mock('../../utils/logger', () => ({
  logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import { mediaApi } from '../media';
import { apiClient } from '../client';

/** A minimal Response-like object for fetch mocks. */
function mockFetchResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

beforeEach(() => {
  mockStore.clear();
  jest.clearAllMocks();
  jest.spyOn(globalThis, 'fetch').mockResolvedValue(
    mockFetchResponse(200, {
      success: true,
      data: {
        key: 'img/abc123',
        url: 'https://storage.example.com/img/abc123',
        cdnUrl: 'https://cdn.example.com/img/abc123',
        filename: 'photo.jpg',
        mimetype: 'image/jpeg',
        size: 51200,
        cacheControl: 'public, max-age=31536000, immutable',
        cachePolicy: 'immutable',
      },
    })
  );
});

afterEach(() => {
  jest.restoreAllMocks();
});

const IMAGE_UPLOAD_RESPONSE = {
  success: true,
  data: {
    key: 'img/abc123',
    url: 'https://storage.example.com/img/abc123',
    cdnUrl: 'https://cdn.example.com/img/abc123',
    filename: 'photo.jpg',
    mimetype: 'image/jpeg',
    size: 51200,
    cacheControl: 'public, max-age=31536000, immutable',
    cachePolicy: 'immutable',
  },
};

describe('upload cache (immutable skip)', () => {
  const fp = 'image/jpeg|photo.jpg|51200';

  it('calls fetch when no cache entry exists', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(mockFetchResponse(200, IMAGE_UPLOAD_RESPONSE));

    const result = await mediaApi.uploadImage(new FormData(), { fingerprint: fp });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(result.data!.key).toBe('img/abc123');
    expect(result.data!.cached).toBeUndefined();
  });

  it('skips fetch for a cached immutable upload and marks cached:true', async () => {
    // Seed the upload registry with an immutable record for this fingerprint.
    await mediaApi.uploadImage(new FormData(), { fingerprint: fp });
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    // Second call with the same fingerprint — should skip fetch entirely.
    const result = await mediaApi.uploadImage(new FormData(), { fingerprint: fp });
    expect(globalThis.fetch).toHaveBeenCalledTimes(1); // fetch NOT called again
    expect(result.success).toBe(true);
    expect(result.data!.key).toBe('img/abc123');
    expect(result.data!.cached).toBe(true);
  });

  it('does NOT skip for a non-immutable cached upload (medium-lived)', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(
      mockFetchResponse(200, {
        success: true,
        data: {
          key: 'vid/456',
          url: 'https://storage.example.com/vid/456',
          cdnUrl: 'https://cdn.example.com/vid/456',
          filename: 'clip.mp4',
          mimetype: 'video/mp4',
          size: 10_000_000,
          cacheControl: 'public, max-age=86400',
          cachePolicy: 'medium-lived',
        },
      })
    );

    await mediaApi.uploadVideo(new FormData(), { fingerprint: 'video/mp4|clip.mp4|10000000' });
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    // Same fingerprint, but policy is medium-lived — should NOT skip.
    await mediaApi.uploadVideo(new FormData(), { fingerprint: 'video/mp4|clip.mp4|10000000' });
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('does NOT cache (and thus never skips) when no fingerprint is given', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(mockFetchResponse(200, IMAGE_UPLOAD_RESPONSE));

    await mediaApi.uploadImage(new FormData()); // no fingerprint
    await mediaApi.uploadImage(new FormData()); // same file, no fingerprint again
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('does not skip when upload response has no cachePolicy', async () => {
    const fp2 = 'image/jpeg|x.jpg|100';
    globalThis.fetch = jest.fn().mockResolvedValue(
      mockFetchResponse(200, {
        success: true,
        data: {
          key: 'x',
          url: 'https://storage.example.com/x',
          cdnUrl: 'https://cdn.example.com/x',
          filename: 'f.jpg',
          mimetype: 'image/jpeg',
          size: 100,
        },
      })
    );

    await mediaApi.uploadImage(new FormData(), { fingerprint: fp2 });
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    // No cachePolicy → record stored with policy undefined → getImmutableUpload returns null.
    await mediaApi.uploadImage(new FormData(), { fingerprint: fp2 });
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });
});

describe('presigned download URL cache (revalidate-after-TTL)', () => {
  const key = 'uploads/img/avatar.jpg';
  const mockClient = apiClient as jest.Mocked<typeof apiClient>;

  it('calls the API on first fetch and caches the result', async () => {
    mockClient.get.mockResolvedValue({
      success: true,
      data: { url: 'https://signed.url/1', expiresIn: 3600 },
    });

    const result = await mediaApi.getPresignedDownloadUrl(key, 3600, 'short-lived');

    expect(mockClient.get).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(result.data!.url).toBe('https://signed.url/1');
    expect(result.data!.cached).toBeUndefined();
  });

  it('serves a fresh entry from cache without calling the API', async () => {
    mockClient.get.mockResolvedValue({
      success: true,
      data: { url: 'https://signed.url/2', expiresIn: 3600 },
    });

    // First call populates the cache.
    await mediaApi.getPresignedDownloadUrl(key, 3600, 'short-lived');
    expect(mockClient.get).toHaveBeenCalledTimes(1);

    // Second call — should be served from cache.
    const result = await mediaApi.getPresignedDownloadUrl(key, 3600, 'short-lived');
    expect(mockClient.get).toHaveBeenCalledTimes(1);
    expect(result.data!.cached).toBe(true);
    expect(result.data!.url).toBe('https://signed.url/2');
  });

  it('revalidates (re-fetches) after the policy TTL', async () => {
    mockClient.get.mockResolvedValueOnce({
      success: true,
      data: { url: 'https://signed.url/3', expiresIn: 3600 },
    });

    // Seed a stale cache entry (2 hours old — past the 1h short-lived TTL).
    await mediaApi.getPresignedDownloadUrl(key, 3600, 'short-lived');
    mockClient.get.mockClear();

    // Mutate the stored record's cachedAt so it's stale. Yes, this is touching
    // the mock store directly — it's the only way to simulate clock passage
    // without fake timers (which don't affect the Date.now() captured at write).
    const staleRecord = JSON.stringify({
      url: 'https://signed.url/3',
      expiresIn: 3600,
      cachedAt: Date.now() - 2 * 60 * 60 * 1000,
    });
    // Re-seed through the test-only mock-store access, since we control it.
    // Use the raw AsyncStorage mock that writes to mockStore.
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem(`media_signed_url_${key}`, staleRecord);

    // The cache entry is stale → must call the API again.
    mockClient.get.mockResolvedValueOnce({
      success: true,
      data: { url: 'https://signed.url/4', expiresIn: 3600 },
    });
    const result = await mediaApi.getPresignedDownloadUrl(key, 3600, 'short-lived');
    expect(mockClient.get).toHaveBeenCalledTimes(1);
    expect(result.data!.url).toBe('https://signed.url/4');
  });

  it('bypasses the cache when no policy is given', async () => {
    mockClient.get.mockResolvedValue({
      success: true,
      data: { url: 'https://signed.url/5', expiresIn: 3600 },
    });

    // First call without policy — no cache.
    await mediaApi.getPresignedDownloadUrl(key, 3600, undefined);
    expect(mockClient.get).toHaveBeenCalledTimes(1);

    // Second call without policy — API called again (no caching).
    await mediaApi.getPresignedDownloadUrl(key, 3600, undefined);
    expect(mockClient.get).toHaveBeenCalledTimes(2);
  });
});
