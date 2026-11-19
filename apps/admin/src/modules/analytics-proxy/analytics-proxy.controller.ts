import { Controller, All, Req, Res, UseGuards, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { buildIdentityHeaders } from '../../common/identity-headers';

const ANALYTICS_URL = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3008';
const API_PREFIX_RE = /^\/(?:api\/)?v\d+\/analytics/;

/** Hop-by-hop headers to strip from proxied responses */
const SKIP_HEADERS = new Set(['transfer-encoding', 'connection', 'keep-alive', 'content-encoding']);

// Aligned with the rest of the admin surface (JwtAuthGuard + RolesGuard):
// the JwtStrategy accepts the httpOnly access_token cookie, gateway x-user-*
// stamps, and Bearer headers — the generic ServiceAuthGuard's cookie branch
// verifies against an unconfigured jwtService here, so direct :4016
// cookie-only requests 401'd even though every other admin route worked.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
@Controller('analytics')
export class AnalyticsProxyController {
  private readonly logger = new Logger(AnalyticsProxyController.name);

  /** Base path proxy */
  @All()
  proxyRoot(@Req() req: Request, @Res() res: Response) {
    return this.proxyAll(req, res);
  }

  /** Catch-all proxy: /api/v1/analytics/* → analytics-service /v1/* */
  @All('*')
  async proxyAll(@Req() req: Request, @Res() res: Response) {
    const targetPath = req.path.replace(API_PREFIX_RE, '');
    const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
    // analytics-service controllers: search/corrections is nested under @Controller('analytics'),
    // while task/event proxies mount at the root /v1 level.
    const upstreamSubPath = targetPath.startsWith('/search/') || targetPath === '/search' ? `/analytics${targetPath}` : targetPath;
    const targetUrl = `${ANALYTICS_URL}/v1${upstreamSubPath}${queryString ? `?${queryString}` : ''}`;

    try {
      const upstream = await fetch(targetUrl, {
        method: req.method,
        headers: {
          'content-type': (req.headers['content-type'] as string) || 'application/json',
          // Identity: forward the Bearer token when present, and always stamp
          // the verified identity for cookie-only SPA flows (bare forwarding
          // 401'd every SPA request — the browser never sends a Bearer header).
          ...buildIdentityHeaders(req),
        },
        body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? JSON.stringify(req.body) : undefined,
      });

      // Forward response headers (skip hop-by-hop)
      upstream.headers.forEach((value, key) => {
        if (!SKIP_HEADERS.has(key.toLowerCase())) {
          res.setHeader(key, value);
        }
      });

      res.status(upstream.status);

      // Stream the body — works for both JSON and non-JSON
      const body = await upstream.text();
      res.send(body);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Proxy error: ${req.method} ${targetUrl} — ${message}`);

      // Graceful fallback for search corrections when analytics service is offline
      if (targetPath.includes('search/corrections')) {
        const days = Number(req.query.days) || 30;
        res.status(200).json({
          success: true,
          data: {
            days,
            overall: { shown: 0, accepted: 0, rate: 0 },
            series: [],
          },
        });
        return;
      }

      res.status(502).json({
        success: false,
        error: 'Analytics service unavailable',
        message,
      });
    }
  }
}
