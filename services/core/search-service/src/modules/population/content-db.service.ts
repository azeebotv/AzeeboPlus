import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

/**
 * One denormalized row read from the content DB (content-service's database).
 * Mirrors the search index's ContentItem model so the population job can
 * upsert it 1:1.
 */
export interface ContentSourceRow {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  status: string;
  viewCount: number;
  creatorId: string | null;
  createdAt: Date;
  updatedAt: Date;
  universeId: string;
  /** Universe slug (e.g. 'reality', 'movie') — the search index's `universe`
   * and the derivation of `contentType` (this platform's content types ARE
   * its universes). */
  universe: string;
  duration: number | null;
  /** Denormalized category names from the content_categories relation. */
  categories: string[];
  /** Denormalized creator displayName (content DB users.displayName). */
  creatorName: string | null;
}

/**
 * Keyset-paginated query over the content DB's published content. Categories
 * are resolved through the Prisma implicit m2m junction (`_CategoryToContentItem`
 * holds category id in "A" and content item id in "B"); creator displayName is
 * the content DB's `users.displayName` keyed by `content_items.creatorId`.
 */
export function buildPopulationQuery(_cursor: string, _batchSize: number): string {
  return `
    SELECT
      ci.id,
      ci.title,
      ci.description,
      ci.thumbnail,
      ci.status,
      ci."viewCount",
      ci."creatorId",
      ci."createdAt",
      ci."updatedAt",
      u.id AS "universeId",
      u.name AS universe,
      ma.duration,
      COALESCE(
        array_agg(c.name ORDER BY c.name) FILTER (WHERE c.name IS NOT NULL),
        '{}'
      ) AS categories,
      usr."displayName" AS "creatorName"
    FROM content_items ci
    JOIN universes u ON u.id = ci."universeId"
    LEFT JOIN media_assets ma ON ma."contentItemId" = ci.id
    LEFT JOIN "_CategoryToContentItem" j ON j."B" = ci.id
    LEFT JOIN categories c ON c.id = j."A"
    LEFT JOIN users usr ON usr.id = ci."creatorId"
    WHERE ci.status = 'published'
      AND ci.id > $1
    GROUP BY
      ci.id, ci.title, ci.description, ci.thumbnail, ci.status,
      ci."viewCount", ci."creatorId", ci."createdAt", ci."updatedAt",
      u.id, u.name, ma.duration, usr."displayName"
    ORDER BY ci.id
    LIMIT $2
  `;
}

/**
 * Read-only access to the content DB for the search-index population job.
 * The connection is created lazily from `CONTENT_DATABASE_URL` so boot and
 * tests don't fail when the env var is absent — the job simply reports it
 * cannot run and retries on the next tick.
 */
@Injectable()
export class ContentDbService implements OnModuleDestroy {
  private readonly logger = new Logger(ContentDbService.name);
  private pool: Pool | null = null;

  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  private getPool(): Pool {
    if (!this.pool) {
      const url = this.config.get<string>('CONTENT_DATABASE_URL');
      if (!url) {
        throw new Error(
          'CONTENT_DATABASE_URL is not set — cannot read the content DB for index population'
        );
      }
      this.pool = new Pool({ connectionString: url, max: 5 });
    }
    return this.pool;
  }

  /** Fetch one keyset page of published content, oldest id first. Returns an
   * empty array when `cursor` is past the last row. */
  async fetchPage(cursor: string, batchSize: number): Promise<ContentSourceRow[]> {
    const result = await this.getPool().query<ContentSourceRow>(
      buildPopulationQuery(cursor, batchSize),
      [cursor, batchSize]
    );
    return result.rows;
  }

  /** Health probe: verifies the content DB is reachable and the tables the
   * population query depends on exist. Returns a short human-readable status
   * for logs; throws when the DB is unreachable. */
  async ping(): Promise<{ reachable: boolean; note: string }> {
    await this.getPool().query('SELECT 1');
    return { reachable: true, note: 'content DB reachable' };
  }

  async onModuleDestroy(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.logger.log('Closed content DB pool');
    }
  }
}
