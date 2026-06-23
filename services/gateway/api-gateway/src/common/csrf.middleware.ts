import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomBytes, createHash } from 'crypto';

/**
 * CSRF Protection Middleware (SEC-005)
 *
 * Implements the Double Submit Cookie pattern:
 * 1. Server generates a CSRF token and sets it as a cookie
 * 2. Client includes the token in X-CSRF-Token header on state-changing requests
 * 3. Server validates the token matches
 *
 * This is required before switching to HttpOnly cookie-based authentication.
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CsrfMiddleware.name);
  private static readonly CSRF_COOKIE_NAME = '_csrf';
  private static readonly CSRF_HEADER_NAME = 'x-csrf-token';
  private static readonly SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

  use(req: Request, res: Response, next: NextFunction) {
    // Skip CSRF for safe methods
    if (CsrfMiddleware.SAFE_METHODS.includes(req.method)) {
      // Set CSRF token on safe methods so client can read it
      let csrfToken = req.cookies[CsrfMiddleware.CSRF_COOKIE_NAME];
      if (!csrfToken) {
        csrfToken = randomBytes(32).toString('hex');
        res.cookie(CsrfMiddleware.CSRF_COOKIE_NAME, csrfToken, {
          httpOnly: false, // Client needs to read this to set the header
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
        });
      }
      return next();
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
    const cookieHash = createHash('sha256').update(cookieToken).digest('hex');
    const headerHash = createHash('sha256').update(headerToken).digest('hex');

    if (cookieHash !== headerHash) {
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
