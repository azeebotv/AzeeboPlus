import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomBytes, createHash, timingSafeEqual } from 'crypto';

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

  use(req: Request, res: Response, next: NextFunction) {
    if (CsrfMiddleware.SAFE_METHODS.includes(req.method)) {
      let csrfToken = req.cookies?.[CsrfMiddleware.CSRF_COOKIE_NAME];
      if (!csrfToken) {
        csrfToken = randomBytes(32).toString('hex');
        res.cookie(CsrfMiddleware.CSRF_COOKIE_NAME, csrfToken, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
        });
      }
      res.setHeader('X-CSRF-Token', csrfToken);
      return next();
    }

    // CSRF only protects cookie-authenticated flows; Bearer token requests cannot be forged via CSRF
    const authHeader = req.headers['authorization'];
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return next();
    }

    if (!req.cookies) {
      this.logger.warn(`CSRF validation failed: cookies unavailable [${req.method} ${req.path}]`);
      res.status(403).json({
        success: false,
        error: 'CSRF validation unavailable',
        message: 'Cookies are required for CSRF protection',
      });
      return;
    }

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

    next();
  }
}
