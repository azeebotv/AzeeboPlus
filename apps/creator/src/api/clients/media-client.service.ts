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
}
