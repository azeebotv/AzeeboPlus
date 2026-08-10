import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';
import { randomUUID } from 'crypto';

export interface CdnPurgeResult {
  /** CloudFront invalidation ID, when one was created. */
  invalidationId?: string;
  /** Number of paths submitted for invalidation. */
  purged: number;
}

/**
 * CDN cache invalidation for uploaded media. Media objects are cached at the
 * CDN edge for up to a year (media_cdn_edge_cache), so flipping that flag off
 * does NOT evict already-cached objects — ops must purge them explicitly.
 * This wraps CloudFront CreateInvalidation (path-based), which supports both
 * exact keys (single path) and prefixes (wildcard path). When no
 * CLOUDFRONT_DISTRIBUTION_ID is configured (local/dev), purges are a logged
 * no-op so the pipeline still works without a CDN.
 */
@Injectable()
export class CdnPurgeService {
  private readonly logger = new Logger(CdnPurgeService.name);
  private readonly distributionId: string;
  private readonly cloudFront: CloudFrontClient | null;

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {
    this.distributionId = this.configService.get<string>('CLOUDFRONT_DISTRIBUTION_ID') || '';
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

    this.cloudFront = this.distributionId
      ? new CloudFrontClient({
          region: this.configService.get<string>('AWS_REGION') || 'us-east-1',
          ...(accessKeyId && secretAccessKey
            ? { credentials: { accessKeyId, secretAccessKey } }
            : {}),
        })
      : null;

    if (!this.cloudFront) {
      this.logger.warn(
        'CLOUDFRONT_DISTRIBUTION_ID not set — CDN purges will be no-ops (dev mode)'
      );
    }
  }

  /** Purge specific object keys, e.g. ['uploads/abc.jpg', 'uploads/def.png']. */
  async purgeKeys(keys: string[]): Promise<CdnPurgeResult> {
    // Normalize each key to a leading-slash path, then dedupe.
    const paths = [
      ...new Set(
        keys
          .filter((k) => k && k.trim())
          .map((k) => `/${k.trim().replace(/^\/+/, '')}`)
      ),
    ];
    return this.createInvalidation(paths);
  }

  /** Purge everything under a key prefix, e.g. 'uploads' → '/uploads/*'. */
  async purgePrefix(prefix: string): Promise<CdnPurgeResult> {
    const clean = prefix.trim().replace(/^\/+|\/+$/g, '');
    if (!clean) {
      return { purged: 0 };
    }
    return this.createInvalidation([`/${clean}/*`]);
  }

  private async createInvalidation(paths: string[]): Promise<CdnPurgeResult> {
    if (paths.length === 0) {
      return { purged: 0 };
    }
    if (!this.cloudFront) {
      this.logger.warn(
        `CDN purge skipped (CloudFront not configured): ${paths.length} path(s)`
      );
      return { purged: 0 };
    }

    try {
      const command = new CreateInvalidationCommand({
        DistributionId: this.distributionId,
        InvalidationBatch: {
          CallerReference: randomUUID(),
          Paths: {
            Quantity: paths.length,
            Items: paths,
          },
        },
      });
      const result = await this.cloudFront.send(command);
      this.logger.log(
        `CDN invalidation ${result.Invalidation?.Id ?? '(unknown)'} created for ${paths.length} path(s)`
      );
      return {
        invalidationId: result.Invalidation?.Id,
        purged: paths.length,
      };
    } catch (error: unknown) {
      this.logger.error(
        `CDN purge failed: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }
}
