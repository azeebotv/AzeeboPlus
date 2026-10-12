import { Injectable, NestMiddleware, Logger, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createHash, timingSafeEqual } from 'crypto';
import { FeatureFlagService, gatewayFlags } from '@azeebo/feature-flags';
import { CsrfTokenRegistry } from './csrf-token-registry.service';

/**
 * CSRF Protection Middleware (SEC-005)
 *
 * Implements the Double Submit Cookie pattern:
 * 1. Server generates a CSRF token and sets it as a cookie
 * 2. Client includes the token in X-CSRF-Token header on state-changing requests
 * 3. Server validates the token matches
 *
 * NOTE: The CSRF cookie is only set on safe methods (GET/HEAD/OPTIONS).
 * SPA clients must make at least one GET request before POSTing to bootstrap the CSRF cookie.
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CsrfMiddleware.name);
  private static readonly CSRF_COOKIE_NAME = '_csrf';
  private static readonly CSRF_HEADER_NAME = 'x-csrf-token';
  private static readonly SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

  constructor(
    @Inject(FeatureFlagService) private readonly featureFlagService: FeatureFlagService,
    private readonly csrfRegistry: CsrfTokenRegistry
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Emergency kill-switch: gateway_csrf_enforce=false bypasses validation
    // (e.g., during a CSRF regression or legacy client migration).
    if (!(await this.featureFlagService.isEnabled(gatewayFlags.csrfEnforce))) {
      this.logger.warn('CSRF enforcement disabled via feature flag — bypassing');
      return next();
    }

    // Skip CSRF for safe methods
    if (CsrfMiddleware.SAFE_METHODS.includes(req.method)) {
      const cookieToken = req.cookies?.[CsrfMiddleware.CSRF_COOKIE_NAME];
      if (cookieToken && (await this.csrfRegistry.isRegistered(cookieToken))) {
        // Still-valid cookie: echo the token in the response header so clients
        // can always re-sync. Without this echo, a client whose cached header
        // drifted from its httpOnly cookie (page reload, partial cookie
        // expiry, restored session) could never learn the current token —
        // every mutation would 403 forever, and each failure fed the
        // per-IP violation counter toward a full client ban.
        res.setHeader(CsrfMiddleware.CSRF_HEADER_NAME, cookieToken);
        return next();
      }
      // Absent, expired, or unregistered cookie: mint AND register a fresh
      // token (the token only validates later if it exists in the Redis-backed
      // registry — persists across gateway restarts, so clients' cached tokens
      // survive deploys).
      const csrfToken = this.csrfRegistry.mint();
      void this.csrfRegistry.register(csrfToken);
      res.cookie(CsrfMiddleware.CSRF_COOKIE_NAME, csrfToken, {
        httpOnly: true, // Prevents XSS exfiltration — token is sent in response header instead
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        path: '/',
      });
      // Send token in response header so clients can read it and set the
      // X-CSRF-Token header on subsequent requests. httpOnly cookie blocks
      // JavaScript access; this header is the client-side source of truth.
      res.setHeader(CsrfMiddleware.CSRF_HEADER_NAME, csrfToken);
      return next();
    }

    // CSRF only protects cookie-authenticated flows: a browser automatically
    // attaches cookies to cross-origin requests, but never Authorization
    // headers. Requests carrying a bearer token cannot be CSRF-attacked, so
    // skip validation for them. This is also what lets native/mobile clients
    // (which have no cookie jar) perform state-changing calls through the
    // gateway without a CSRF token.
    const authHeader = req.headers['authorization'];
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return next();
    }

    // Reject if cookie-parser is not configured (cookies unavailable) — cannot validate CSRF
    if (!req.cookies) {
      this.logger.warn(`CSRF validation failed: cookies unavailable [${req.method} ${req.path}]`);
      res.status(403).json({
        success: false,
        error: 'CSRF validation unavailable',
        message: 'Cookies are required for CSRF protection',
      });
      return;
    }

    // Validate CSRF token on state-changing methods
    const cookieToken = req.cookies[CsrfMiddleware.CSRF_COOKIE_NAME];
    const headerToken = req.headers[CsrfMiddleware.CSRF_HEADER_NAME] as string;

    if (!cookieToken || !headerToken) {
      this.logger.warn(`CSRF validation failed: missing token [${req.method} ${req.path}]`);
      res.status(403).json({
        success: false,
        error: 'CSRF token missing',
        message: 'X-CSRF-Token header and _csrf cookie are required for this request',
      });
      return;
    }

    // Timing-safe comparison
    const cookieHash = createHash('sha256').update(cookieToken).digest();
    const headerHash = createHash('sha256').update(headerToken).digest();

    if (cookieHash.length !== headerHash.length || !timingSafeEqual(cookieHash, headerHash)) {
      this.logger.warn(`CSRF validation failed: token mismatch [${req.method} ${req.path}]`);
      res.status(403).json({
        success: false,
        error: 'CSRF token mismatch',
        message: 'The CSRF token does not match the cookie value',
      });
      return;
    }

    // Server-side state: the token must have been minted by this deployment.
    // Fails open when Redis is unavailable (validation degrades to the plain
    // double-submit check above). This rejects tokens that never originated
    // here and caps the blast radius of a leaked token at its 24h TTL.
    const registered = await this.csrfRegistry.isRegistered(cookieToken);
    if (!registered) {
      this.logger.warn(`CSRF validation failed: token not in registry [${req.method} ${req.path}]`);
      res.status(403).json({
        success: false,
        error: 'CSRF token unknown',
        message:
          'The CSRF token was not issued by this server or has expired — re-bootstrap via GET /api/v1/auth/csrf',
      });
      return;
    }

    next();
  }
}
