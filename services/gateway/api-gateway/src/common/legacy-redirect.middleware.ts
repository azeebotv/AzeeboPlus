import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Backward-compatibility redirect middleware (T-H21, T-H22, T-H24).
 *
 * Maps legacy unversioned paths to their versioned equivalents:
 *   /api/wallet/*        → /api/v1/wallet/*
 *   /api/payments/*      → /api/v1/payments/*
 *   /api/notifications/* → /api/v1/notifications/*
 *
 * Uses HTTP 308 Permanent Redirect so the method and body are preserved.
 */
@Injectable()
export class LegacyRedirectMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LegacyRedirectMiddleware.name);

  /** Prefixes that need versioning when they appear directly after /api/ */
  private readonly LEGACY_PREFIXES = ['wallet', 'payments', 'notifications'];

  use(req: Request, res: Response, next: NextFunction): void {
    const originalUrl: string = req.originalUrl || req.url;

    // Only intercept /api/{service}… that are NOT already versioned
    // e.g.  /api/wallet/balance          → match
    //        /api/v1/wallet/balance       → skip (already versioned)
    //        /api/wallet?foo=bar          → match
    for (const prefix of this.LEGACY_PREFIXES) {
      // Matches: /api/wallet[/...] or /api/wallet[?...]
      // Excludes: /api/v1/wallet[/...] (already versioned)
      const pattern = `/api/${prefix}`;
      if (
        originalUrl === pattern ||
        originalUrl.startsWith(`${pattern}/`) ||
        originalUrl.startsWith(`${pattern}?`)
      ) {
        const redirected = originalUrl.replace(`/api/${prefix}`, `/api/v1/${prefix}`);
        this.logger.warn(`Legacy path redirect: ${originalUrl} → ${redirected} (308)`);
        res.redirect(308, redirected);
        return;
      }
    }

    next();
  }
}
