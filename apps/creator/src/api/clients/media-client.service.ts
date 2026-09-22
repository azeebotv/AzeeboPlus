import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface MediaServiceResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

/** Subset of media-service UploadResponse the portal consumes. */
export interface MediaUploadResult {
  key: string;
  url: string;
  cdnUrl: string;
  filename: string;
  mimetype: string;
  size: number;
  scanStatus?: 'clean';
}

/** Signed playback URL for a stored object. */
export interface MediaSignedUrlResult {
  url: string;
  expiresIn: number;
}

export interface MediaFilePayload {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

/**
 * Forwards uploaded files to media-service — the platform's real blob pipeline
 * (S3 storage, MIME sniffing, virus scan, transcoding, CDN URLs).
 *
 * Service-to-service call pattern: direct URL + `x-gateway-secret` internal
 * identity headers, identical to WalletClientService / CreatorsClientService.
 */
@Injectable()
export class MediaClientService {
  private readonly logger = new Logger(MediaClientService.name);
  private readonly mediaServiceUrl: string;
  private readonly internalApiKey: string;

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {
    this.mediaServiceUrl =
      this.configService.get<string>('MEDIA_SERVICE_URL') ?? 'http://localhost:3019';
    this.internalApiKey =
      this.configService.get<string>('GATEWAY_SECRET') ??
      this.configService.getOrThrow<string>('INTERNAL_API_KEY');
  }

  /**
   * Sends the file to media-service's typed upload endpoint. Returns the
   * stored object's key and CDN URL, or null when media-service is
   * unreachable or rejects the file, so callers can degrade to
   * metadata-only registration instead of failing the request.
   */
  async forwardUpload(file: MediaFilePayload): Promise<MediaUploadResult | null> {
    const kind = this.mapContentType(file.mimetype);
    const url = `${this.mediaServiceUrl.replace(/\/$/, '')}/v1/media/upload/${kind}`;

    try {
      // Native FormData (undici) produces the multipart encoding so busboy on
      // the far side always parses it, and the part carries the file's real
      // MIME type — required by media-service's MIME-mismatch check.
      const form = new FormData();
      form.append(
        'file',
        new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }),
        file.originalname
      );

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'x-gateway-secret': this.internalApiKey,
          'x-user-id': 'service',
          'x-user-role': 'service',
        },
        body: form,
        signal: AbortSignal.timeout(120_000),
      });

      const payload = (await response.json().catch(() => null)) as
        | (MediaServiceResponse<MediaUploadResult> & { message?: string })
        | null;

      if (!response.ok || !payload?.success || !payload.data) {
        this.logger.warn(
          `media-service upload rejected (HTTP ${response.status}): ${
            payload?.error ?? payload?.message ?? 'no body'
          }`.slice(0, 300)
        );
        return null;
      }
      return payload.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`media-service upload unavailable, degrading to metadata-only: ${message}`);
      return null;
    }
  }

  /** Maps a raw file MIME type onto media-service's upload endpoint kind. */
  private mapContentType(mimetype: string): string {
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype.startsWith('audio/')) return 'audio';
    if (mimetype.startsWith('image/')) return 'image';
    return 'document';
  }

  /**
   * Requests a short-lived signed playback URL for a stored object key via
   * media-service's GET /v1/media/presigned/download. The key never reaches
   * the portal client — only the time-limited signed URL does. Returns null
   * when media-service is unreachable or rejects the key (caller decides
   * whether that is an error or a degraded state).
   */
  async getSignedPlaybackUrl(key: string, expiresIn = 600): Promise<MediaSignedUrlResult | null> {
    const url = `${this.mediaServiceUrl.replace(/\/$/, '')}/v1/media/presigned/download`;
    try {
      const response = await fetch(`${url}?key=${encodeURIComponent(key)}&expiresIn=${expiresIn}`, {
        headers: {
          'x-gateway-secret': this.internalApiKey,
          'x-user-id': 'service',
          'x-user-role': 'service',
        },
        signal: AbortSignal.timeout(10_000),
      });

      const payload = (await response.json().catch(() => null)) as
        | MediaServiceResponse<MediaSignedUrlResult>
        | null;

      if (!response.ok || !payload?.success || !payload.data?.url) {
        this.logger.warn(
          `media-service presigned download rejected (HTTP ${response.status}): ${
            payload?.error ?? payload?.message ?? 'no body'
          }`.slice(0, 300)
        );
        return null;
      }
      return payload.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`media-service presigned download unavailable: ${message}`);
      return null;
    }
  }

  /**
   * Generates a premium (token-gated) URL through media-service's
   * POST /v1/media/premium/url. Used for exclusive content where playback
   * must be attributable + revocable, not just expiry-limited.
   */
  async getPremiumUrl(contentId: string, userId: string, expiresIn = 600): Promise<MediaSignedUrlResult & { expiresAt?: string; token?: string } | null> {
    const url = `${this.mediaServiceUrl.replace(/\/$/, '')}/v1/media/premium/url`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gateway-secret': this.internalApiKey,
          'x-user-id': userId,
          'x-user-role': 'creator',
        },
        body: JSON.stringify({ contentId, expiresInSeconds: expiresIn }),
        signal: AbortSignal.timeout(10_000),
      });

      const payload = (await response.json().catch(() => null)) as
        | MediaServiceResponse<MediaSignedUrlResult & { expiresAt?: string; token?: string }>
        | null;

      if (!response.ok || !payload?.success || !payload.data?.url) {
        this.logger.warn(
          `media-service premium url rejected (HTTP ${response.status}): ${
            payload?.error ?? payload?.message ?? 'no body'
          }`.slice(0, 300)
        );
        return null;
      }
      return payload.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`media-service premium url unavailable: ${message}`);
      return null;
    }
  }

  /**
   * Deletes a stored object through media-service's DELETE /v1/media/:key
   * (the portal's uploads carry the `service` identity, which owns the
   * objects, so the upstream ownership check passes). Returns 'deleted' when
   * media-service removed the object, 'missing' when the object or its
   * metadata is already gone (treated as success — delete is idempotent),
   * and null when media-service is unreachable or refused (caller decides
   * whether that degrades or fails).
   */
  async deleteObject(
    key: string
  ): Promise<'deleted' | 'missing' | null> {
    const url = `${this.mediaServiceUrl.replace(/\/$/, '')}/v1/media/${encodeURIComponent(key)}`;
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'x-gateway-secret': this.internalApiKey,
          'x-user-id': 'service',
          'x-user-role': 'service',
        },
        signal: AbortSignal.timeout(10_000),
      });

      if (response.status === 404) return 'missing';

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | MediaServiceResponse<unknown>
          | null;
        this.logger.warn(
          `media-service object delete rejected (HTTP ${response.status}): ${
            payload?.error ?? payload?.message ?? 'no body'
          }`.slice(0, 300)
        );
        return null;
      }
      return 'deleted';
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`media-service object delete unavailable: ${message}`);
      return null;
    }
  }
}
