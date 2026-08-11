import { apiClient } from './client';
import type { ApiResponse } from './auth';
import { mediaCache } from '../utils/mediaCache';
import { logger } from '../utils/logger';

const MEDIA_BASE_URL = apiClient.getBaseURL();

/** Typed caching behavior of the upload's Cache-Control (media_cdn_edge_cache). */
export type UploadCachePolicy =
  | 'no-store'
  | 'immutable'
  | 'long-lived'
  | 'medium-lived'
  | 'short-lived';

export interface MediaUploadResponse {
  key: string;
  url: string;
  cdnUrl: string;
  filename: string;
  mimetype: string;
  size: number;
  /** Raw Cache-Control directive (e.g. `public, max-age=86400`). */
  cacheControl?: string;
  /** Typed caching behavior — switch on this instead of parsing cacheControl. */
  cachePolicy?: UploadCachePolicy;
  /** True when the response was served from the local cache (immutable skip). */
  cached?: boolean;
}

export interface MediaUploadOptions {
  /** Stable identity for the local file (name+type+size). When provided and
   * the recorded policy is `immutable`, the upload is skipped entirely and the
   * cached response is returned with `cached: true`. */
  fingerprint?: string;
}


export interface PresignedUploadResponse {
  uploadUrl: string;
  key: string;
  cdnUrl: string;
  expiresIn: number;
}

export interface FileMetadata {
  contentType: string;
  contentLength: number;
  lastModified: Date;
  metadata?: Record<string, string>;
}

/** Shared upload helper: checks the immutable cache when a fingerprint is
 * given, performs the fetch on a cache miss, and remembers the result for
 * future skips on success. */
async function uploadFile(
  path: string,
  file: FormData,
  options?: MediaUploadOptions
): Promise<ApiResponse<MediaUploadResponse>> {
  if (options?.fingerprint) {
    const cached = await mediaCache.getImmutableUpload(options.fingerprint);
    if (cached) {
      logger.debug(`Reusing immutable upload ${cached.key} (skipped re-upload)`);
      return { success: true, data: { ...cached, cached: true } };
    }
  }

  const token = apiClient.getToken();
  const response = await fetch(`${MEDIA_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: file,
  });
  const data = await response.json();

  if (options?.fingerprint && data?.success && data?.data) {
    await mediaCache.rememberUpload(options.fingerprint, data.data as MediaUploadResponse);
  }
  return data;
}

export const mediaApi = {
  uploadImage: (
    file: FormData,
    options?: MediaUploadOptions
  ): Promise<ApiResponse<MediaUploadResponse>> =>
    uploadFile('/api/v1/media/upload/image', file, options),

  uploadVideo: (
    file: FormData,
    options?: MediaUploadOptions
  ): Promise<ApiResponse<MediaUploadResponse>> =>
    uploadFile('/api/v1/media/upload/video', file, options),

  uploadAvatar: (
    file: FormData,
    options?: MediaUploadOptions
  ): Promise<ApiResponse<MediaUploadResponse>> =>
    uploadFile('/api/v1/media/upload/avatar', file, options),

  getPresignedUploadUrl: async (
    type: 'image' | 'video' | 'audio' | 'document',
    fileId: string,
    extension: string,
    contentType: string,
    expiresIn = 3600
  ): Promise<ApiResponse<PresignedUploadResponse>> => {
    return apiClient.get<ApiResponse<PresignedUploadResponse>>(
      `/v1/media/presigned/upload?type=${type}&fileId=${fileId}&extension=${extension}&contentType=${encodeURIComponent(contentType)}&expiresIn=${expiresIn}`
    );
  },

  /**
   * Revalidate-after-TTL download: pass the asset's known `cachePolicy` and
   * the signed URL is cached for the policy-derived TTL (e.g. 1h for
   * `short-lived`); fresh entries are served locally and only re-fetched
   * (revalidated) once the TTL or the server-side URL expiry passes.
   * Without a policy the call bypasses the cache (treated as `no-store`).
   */
  getPresignedDownloadUrl: async (
    key: string,
    expiresIn = 3600,
    policy?: UploadCachePolicy
  ): Promise<ApiResponse<{ url: string; expiresIn: number; cached?: boolean }>> => {
    const cached = await mediaCache.getCachedSignedUrl(key, policy);
    if (cached) {
      logger.debug(`Serving cached signed URL for ${key} (policy ${policy ?? 'unknown'})`);
      return { success: true, data: { ...cached, cached: true } };
    }

    const response = await apiClient.get<ApiResponse<{ url: string; expiresIn: number }>>(
      `/v1/media/presigned/download?key=${encodeURIComponent(key)}&expiresIn=${expiresIn}`
    );
    if (response.success && response.data && policy) {
      await mediaCache.rememberSignedUrl(key, policy, response.data.url, response.data.expiresIn);
    }
    return response;
  },

  getFileMetadata: async (key: string): Promise<ApiResponse<FileMetadata>> => {
    return apiClient.get<ApiResponse<FileMetadata>>(
      `/v1/media/metadata?key=${encodeURIComponent(key)}`
    );
  },

  deleteFile: async (key: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    return apiClient.delete<ApiResponse<{ success: boolean; message: string }>>(
      `/v1/media/${encodeURIComponent(key)}`
    );
  },
};
