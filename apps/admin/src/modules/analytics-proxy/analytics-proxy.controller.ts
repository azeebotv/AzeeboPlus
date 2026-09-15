import { Controller, All, Req, Res, UseGuards, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { ServiceAuthGuard } from '@azeebo/security';
import { buildIdentityHeaders } from '../../common/identity-headers';

const ANALYTICS_URL = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3008';
const API_PREFIX_RE = /^\/(?:api\/)?v\d+\/analytics/;

/** Hop-by-hop headers to strip from proxied responses */
const SKIP_HEADERS = new Set(['transfer-encoding', 'connection', 'keep-alive', 'content-encoding']);

@UseGuards(ServiceAuthGuard)
@Controller('analytics')
export class AnalyticsProxyController {
  private readonly logger = new Logger(AnalyticsProxyController.name);

  /** Catch-all proxy: /api/v1/analytics/* → analytics-service /v1/* */
  @All('*')
  async proxyAll(@Req() req: Request, @Res() res: Response) {
    const targetPath = req.path.replace(API_PREFIX_RE, '');
    const targetUrl = `${ANALYTICS_URL}/v1${targetPath}`;

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
      res.status(502).json({
        success: false,
        error: 'Analytics service unavailable',
        message,
      });
    }
  }
}
