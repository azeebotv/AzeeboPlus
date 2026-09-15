import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MediaUploadResponse, UploadCachePolicy } from '../api/media';
import { logger } from './logger';

const UPLOAD_PREFIX = 'media_upload_';
const SIGNED_URL_PREFIX = 'media_signed_url_';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Policy-derived cache TTLs (ms), mirroring the media-service `UploadCachePolicy`
 * bands (image 1y immutable, video 1d, audio/document 7d, unknown 1h):
 * - `immutable` → `null` = never revalidates — the skip-re-upload / no-refetch case
 * - `no-store` → `0` = never cached
 * The middle bands feed the revalidate-after-TTL layer: an entry older than its
 * TTL is stale, so the caller re-fetches (revalidates) instead of serving it.
 */
export const POLICY_TTL_MS: Record<UploadCachePolicy, number | null> = {
  immutable: null,
  'long-lived': 7 * DAY,
  'medium-lived': DAY,
  'short-lived': HOUR,
  'no-store': 0,
};

/** TTL for a policy. Unknown/missing policy → 0 (never cached) so the client
 * never serves stale data when the server didn't tell it how to cache.
 * NOTE: null is a valid TTL (immutable = never revalidate), so we check for
 * undefined rather than using `?? 0`. */
export function policyTtlMs(policy?: UploadCachePolicy): number | null {
  if (!policy) return 0;
  const ttl = POLICY_TTL_MS[policy];
  return ttl !== undefined ? ttl : 0;
}

/**
 * Stable-ish identity for a local file: type + name + size. Gallery picks on
 * some platforms don't report a size, so it is optional. Deliberately not the
 * URI (cache paths change between picks); name/size/type is a strong-enough
 * proxy for "same file" to justify skipping an immutable re-upload.
 */
export function mediaFingerprint(file: { name?: string; type?: string; size?: number }): string {
  return [file.type ?? '', file.name ?? '', file.size ?? ''].join('|');
}

export interface UploadRecord {
  response: MediaUploadResponse;
  policy: UploadCachePolicy | undefined;
  cachedAt: number;
}

export interface SignedUrlRecord {
  url: string;
  expiresIn: number;
  cachedAt: number;
}

/**
 * Policy-aware media cache (AsyncStorage-backed, no native deps):
 * - uploads are remembered per file fingerprint; only `immutable` records are
 *   ever served back, so re-picking the same image skips the network upload;
 * - signed download URLs are cached per asset key with a policy-derived TTL
 *   and revalidated (re-fetched) once the TTL or the server-side expiry passes.
 */
export const mediaCache = {
  /** Remember an upload result for a fingerprint. All policies are recorded,
   * but only `immutable` records are served back (see getImmutableUpload). */
  async rememberUpload(fingerprint: string, response: MediaUploadResponse): Promise<void> {
    try {
      const record: UploadRecord = {
        response,
        policy: response.cachePolicy,
        cachedAt: Date.now(),
      };
      await AsyncStorage.setItem(`${UPLOAD_PREFIX}${fingerprint}`, JSON.stringify(record));
    } catch (error) {
      logger.error('Failed to remember upload', error);
    }
  },

  /**
   * The skip-re-upload gate: returns the cached upload for a fingerprint only
   * when its recorded policy is `immutable` — those assets are byte-stable on
   * the CDN (`max-age` 1y, `, immutable`), so re-uploading the same file is
   * pure waste. Every other policy (incl. unknown) returns null so the caller
   * re-uploads; the TTL layer revalidates the short-lived ones.
   */
  async getImmutableUpload(fingerprint: string): Promise<MediaUploadResponse | null> {
    try {
      const raw = await AsyncStorage.getItem(`${UPLOAD_PREFIX}${fingerprint}`);
      if (!raw) return null;
      const record = JSON.parse(raw) as UploadRecord;
      if (record.policy !== 'immutable') return null;
      return record.response;
    } catch (error) {
      logger.error('Failed to read cached upload', error);
      return null;
    }
  },

  /** Drop the upload record for a fingerprint (e.g. after a failed publish). */
  async clearUpload(fingerprint: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${UPLOAD_PREFIX}${fingerprint}`);
    } catch (error) {
      logger.error('Failed to clear upload record', error);
    }
  },

  /** Remember a signed download URL for an asset key under the given policy.
   * `no-store` / unknown policies are never persisted. */
  async rememberSignedUrl(
    key: string,
    policy: UploadCachePolicy | undefined,
    url: string,
    expiresIn: number
  ): Promise<void> {
    const ttl = policyTtlMs(policy);
    if (ttl === 0) return;
    try {
      const record: SignedUrlRecord = { url, expiresIn, cachedAt: Date.now() };
      await AsyncStorage.setItem(`${SIGNED_URL_PREFIX}${key}`, JSON.stringify(record));
    } catch (error) {
      logger.error('Failed to remember signed URL', error);
    }
  },

  /**
   * Revalidate-after-TTL read: returns the cached signed URL while it is fresh
   * — within the policy TTL (immutable → always fresh) AND before the
   * server-side URL expiry. Returns null once stale, so the caller re-fetches
   * (revalidates) and re-remembers.
   */
  async getCachedSignedUrl(
    key: string,
    policy: UploadCachePolicy | undefined
  ): Promise<{ url: string; expiresIn: number } | null> {
    const ttl = policyTtlMs(policy);
    if (ttl === 0) return null;
    try {
      const raw = await AsyncStorage.getItem(`${SIGNED_URL_PREFIX}${key}`);
      if (!raw) return null;
      const record = JSON.parse(raw) as SignedUrlRecord;
      const now = Date.now();
      if (ttl !== null && now - record.cachedAt > ttl) return null;
      if (now - record.cachedAt > record.expiresIn * 1000) return null;
      return { url: record.url, expiresIn: record.expiresIn };
    } catch (error) {
      logger.error('Failed to read cached signed URL', error);
      return null;
    }
  },

  /** Clear every media cache entry (uploads + signed URLs). */
  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const mediaKeys = keys.filter(
        (k) => k.startsWith(UPLOAD_PREFIX) || k.startsWith(SIGNED_URL_PREFIX)
      );
      for (const k of mediaKeys) {
        await AsyncStorage.removeItem(k);
      }
    } catch (error) {
      logger.error('Failed to clear media cache', error);
    }
  },
};
