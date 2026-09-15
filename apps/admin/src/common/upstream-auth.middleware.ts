import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Request-scoped caller credentials for admin-backend's server-side proxies.
 *
 * The admin SPA authenticates with httpOnly cookies and never sends an
 * Authorization header, so proxies that forward "the incoming authorization
 * header if present" hand downstream services zero identity on every SPA
 * request (401 → mapped 502). This middleware captures the caller's
 * credentials — the raw Bearer header for direct/API callers, a Bearer minted
 * from the verified access_token cookie for SPA flows, plus the gateway's
 * stamped identity when present — into AsyncLocalStorage, so proxy services
 * can forward them without per-handler wiring and without shared mutable
 * state (a class static previously made concurrent requests able to
 * cross-contaminate identities).
 *
 * Registered in main.ts via app.use() — deliberately NOT as a Nest module
 * middleware: Nest's forRoutes() does not match URI-versioned routes
 * (/v1/...) registered without an explicit version, so a module-level
 * registration silently never fires. Express-level registration runs before
 * Nest's router and wraps the entire downstream pipeline in the ALS context.
 */
export interface UpstreamAuth {
  /** Caller's Bearer header, or one minted from their verified cookie. */
  authorization?: string;
  /** Gateway-stamped identity headers, when the request came via the gateway. */
  userId?: string;
  email?: string;
  role?: string;
  /** The gateway's own authentication stamp, forwarded verbatim. */
  gatewaySecret?: string;
}

export const upstreamAuthContext = new AsyncLocalStorage<UpstreamAuth>();

function firstHeader(req: Request, name: string): string | undefined {
  const v = req.headers[name];
  const first = Array.isArray(v) ? v[0] : v;
  return typeof first === 'string' && first ? first : undefined;
}

export const upstreamAuthMiddleware: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const ctx: UpstreamAuth = {};

  if (typeof req.headers.authorization === 'string' && req.headers.authorization) {
    ctx.authorization = req.headers.authorization;
  } else if (typeof req.cookies?.access_token === 'string' && req.cookies.access_token) {
    // Cookie-only SPA flow — the cookie was already verified by the JWT
    // guards; mint the upstream Bearer header from it.
    ctx.authorization = `Bearer ${req.cookies.access_token}`;
  }

  // The gateway stamps verified identity onto proxied requests; capture it so
  // services that trust the gateway stamp (not raw JWTs) also work.
  ctx.userId = firstHeader(req, 'x-user-id');
  ctx.email = firstHeader(req, 'x-user-email');
  ctx.role = firstHeader(req, 'x-user-role');
  ctx.gatewaySecret = firstHeader(req, 'x-gateway-secret');

  if (ctx.authorization || ctx.userId) {
    return upstreamAuthContext.run(ctx, next);
  }
  next();
};
