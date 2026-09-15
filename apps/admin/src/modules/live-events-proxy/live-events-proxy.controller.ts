import { Controller, All, Req, Res, UseGuards, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { buildIdentityHeaders } from '../../common/identity-headers';

const LIVE_EVENT_URL = process.env.LIVE_EVENT_SERVICE_URL || 'http://localhost:3027';
/** Both the gateway (/v1/...) and direct vite-proxy (/api/v1/...) shapes. */
const API_PREFIX_RE = /^\/(?:api\/)?v\d+\/admin\/live-events/;

/** Hop-by-hop headers to strip from proxied responses */
const SKIP_HEADERS = new Set(['transfer-encoding', 'connection', 'keep-alive', 'content-encoding']);

/**
 * Admin surface for live events: proxies /api/v1/admin/live-events/* to the
 * live-event-service's /v1/live-events/* (the same routes the mobile/web apps
 * use) so the panel can list, create, update, and cancel events without the
 * gateway needing a dedicated /admin/live-events mapping.
 */
@Controller('admin/live-events')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
export class AdminLiveEventsProxyController {
  private readonly logger = new Logger(AdminLiveEventsProxyController.name);

  /** Bare controller path (list) — the '*' wildcard doesn't match it. */
  @All()
  proxyRoot(@Req() req: Request, @Res() res: Response) {
    return this.proxyAll(req, res);
  }

  @All('*')
  async proxyAll(@Req() req: Request, @Res() res: Response) {
    const targetPath = req.path.replace(API_PREFIX_RE, '') || '';
    const targetUrl = `${LIVE_EVENT_URL}/v1/live-events${targetPath}`;

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

      upstream.headers.forEach((value, key) => {
        if (!SKIP_HEADERS.has(key.toLowerCase())) {
          res.setHeader(key, value);
        }
      });

      res.status(upstream.status);
      const body = await upstream.text();
      res.send(body);
    } catch (e) {
      this.logger.error(`live-events proxy failed: ${(e as Error).message}`);
      res.status(502).json({
        success: false,
        message: 'live-event-service unreachable — is it running? (port 3027)',
      });
    }
  }
}
