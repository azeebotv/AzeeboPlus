import { Controller, All, Req, Res, UseGuards, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { ServiceAuthGuard } from '@azeebo/security';

const ANALYTICS_URL = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3008';
const API_PREFIX = '/api/v1/analytics';

/** Hop-by-hop headers to strip from proxied responses */
const SKIP_HEADERS = new Set(['transfer-encoding', 'connection', 'keep-alive', 'content-encoding']);

@UseGuards(ServiceAuthGuard)
@Controller(API_PREFIX)
export class AnalyticsProxyController {
  private readonly logger = new Logger(AnalyticsProxyController.name);

  /** Catch-all proxy: /api/v1/analytics/* → analytics-service /v1/* */
  @All('*')
  async proxyAll(@Req() req: Request, @Res() res: Response) {
    const targetPath = req.path.replace(API_PREFIX, '');
    const targetUrl = `${ANALYTICS_URL}/v1${targetPath}`;

    try {
      const upstream = await fetch(targetUrl, {
        method: req.method,
        headers: {
          'content-type': (req.headers['content-type'] as string) || 'application/json',
          ...(req.headers.authorization ? { authorization: req.headers.authorization } : {}),
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
