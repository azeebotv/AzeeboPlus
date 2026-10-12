import { Controller, All, Req, Res, UseGuards, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { buildIdentityHeaders } from '../../common/identity-headers';

const CREATOR_SERVICE_URL = process.env.CREATOR_SERVICE_URL || 'http://localhost:3018';
const API_PREFIX_RE = /^\/(?:api\/)?v\d+\/creator-entries/;

/** Hop-by-hop headers to strip from proxied responses */
const SKIP_HEADERS = new Set(['transfer-encoding', 'connection', 'keep-alive', 'content-encoding']);

/**
 * Admin proxy for challenge-entry review against creator-service:
 *   /api/v1/creator-entries?status=…&challengeId=…  → /v1/creators/challenges/entries
 *   /api/v1/creator-entries/:entryId/review (PATCH) → /v1/creators/challenges/entries/:entryId/review
 *
 * Mirrors AnalyticsProxyController (JwtAuthGuard + RolesGuard, cookie-only SPA
 * support via buildIdentityHeaders). Admin-only: review actions change
 * challenge outcomes, so moderators-with-portal-accounts must also hold the
 * admin portal role to reach them through this surface.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
@Controller('creator-entries')
export class CreatorsProxyController {
  private readonly logger = new Logger(CreatorsProxyController.name);

  /** Base path (no trailing segment): the entries listing itself. */
  @All()
  proxyRoot(@Req() req: Request, @Res() res: Response) {
    return this.proxyAll(req, res);
  }

  @All('*')
  async proxyAll(@Req() req: Request, @Res() res: Response) {
    const targetPath = req.path.replace(API_PREFIX_RE, '');
    // Forward the query string (status/challengeId/take filters) — req.path
    // drops it, and without this the queue's filter chips silently no-op.
    const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
    const targetUrl = `${CREATOR_SERVICE_URL}/v1/creators/challenges/entries${targetPath}${queryString ? `?${queryString}` : ''}`;

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
    } catch (message) {
      this.logger.error(`creator-entries proxy error: ${String(message)}`);
      res.status(502).json({
        success: false,
        error: 'Creator service unavailable',
        message,
      });
    }
  }
}
