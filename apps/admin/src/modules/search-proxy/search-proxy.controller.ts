import { Controller, All, Req, Res, UseGuards, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { buildIdentityHeaders } from '../../common/identity-headers';

const SEARCH_SERVICE_URL = process.env.SEARCH_SERVICE_URL || 'http://localhost:3005';
const API_PREFIX_RE = /^\/(?:api\/)?v\d+\/search/;

/** Hop-by-hop headers to strip from proxied responses */
const SKIP_HEADERS = new Set(['transfer-encoding', 'connection', 'keep-alive', 'content-encoding']);

/**
 * Admin proxy for search-service:
 *   /api/v1/search/admin/stats          → /v1/search/admin/stats
 *   /api/v1/search/admin/queries        → /v1/search/admin/queries
 *   /api/v1/search/admin/indexes/repair → /v1/search/admin/indexes/repair
 *   /api/v1/search/*                    → /v1/search/*
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
@Controller('search')
export class SearchProxyController {
  private readonly logger = new Logger(SearchProxyController.name);

  @All()
  proxyRoot(@Req() req: Request, @Res() res: Response) {
    return this.proxyAll(req, res);
  }

  @All('*')
  async proxyAll(@Req() req: Request, @Res() res: Response) {
    const targetPath = req.path.replace(API_PREFIX_RE, '');
    const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
    const targetUrl = `${SEARCH_SERVICE_URL}/v1/search${targetPath}${queryString ? `?${queryString}` : ''}`;

    try {
      const upstream = await fetch(targetUrl, {
        method: req.method,
        headers: {
          'content-type': (req.headers['content-type'] as string) || 'application/json',
          ...buildIdentityHeaders(req),
        },
        body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? JSON.stringify(req.body) : undefined,
      });

      upstream.headers.forEach((value, key) => {
        if (!SKIP_HEADERS.has(key.toLowerCase())) {
          res.setHeader(key, value);
        }
      });

      res.status(upstream.status);
      res.send(await upstream.text());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`search proxy error: ${targetUrl} — ${message}`);

      // Graceful fallback for /admin/stats if search-service is temporarily offline
      if (targetPath === '/admin/stats') {
        res.status(200).json({
          success: true,
          data: {
            totalQueries: 0,
            todayQueries: 0,
            weekQueries: 0,
            avgResultCount: 0,
            topQueries: [],
            totalSearchesToday: 0,
            uniqueSearchers: 0,
            fuzzy: {
              enabled: false,
              pgTrgm: 'unknown',
              indexes: 'unknown',
              degraded: true,
              mode: 'exact',
              warning: 'Search service temporarily offline or unreachable',
              lastProbeAt: null,
            },
          },
        });
        return;
      }

      res.status(502).json({
        success: false,
        error: 'Search service unavailable',
        message,
      });
    }
  }
}
