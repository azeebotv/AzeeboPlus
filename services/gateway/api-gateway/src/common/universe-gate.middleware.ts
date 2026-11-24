import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { FeatureFlagService } from '@azeebo/feature-flags';
import { universeEnabledKey } from '@azeebo/shared-types';

/**
 * Proxy path segment → canonical universe slug (values from UNIVERSE_SLUGS in
 * @azeebo/shared-types). `/movies` routes to the `movie` service but the
 * sentinel is keyed by the canonical singular slug. Deliberately NOT gated:
 * `/creator`, `/creators`, `/live-events`, `/knowledge`, `/music` — either no
 * canonical universe slug (live-events/knowledge) or account-critical APIs a
 * visibility kill-switch must not sever (creator).
 */
const GATED_SERVICE_SLUGS: Readonly<Record<string, string>> = {
  reality: 'reality',
  comedy: 'comedy',
  sports: 'sports',
  vertical: 'vertical',
  movies: 'movie',
  games: 'games',
  lifestyle: 'lifestyle',
};

/**
 * Server-side enforcement of `universe.<slug>.enabled`: a disabled universe's
 * API routes answer 404 with the exact body the gateway returns for an
 * unregistered service — a disabled universe must be indistinguishable from a
 * missing one. Evaluation goes through FeatureFlagService (30s cache; the
 * gateway registers it with staleOnRedisError so an outage keeps the last
 * operator intent instead of fail-opening to the ON default).
 */
@Injectable()
export class UniverseGateMiddleware implements NestMiddleware {
  private readonly logger = new Logger(UniverseGateMiddleware.name);

  constructor(private readonly featureFlags: FeatureFlagService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    if (req.method === 'OPTIONS') {
      // CORS preflight must never reveal (or gate) existence.
      return next();
    }
    const slug = this.matchUniverse(req.path);
    if (!slug) {
      return next();
    }
    this.featureFlags
      .isEnabled(universeEnabledKey(slug))
      .then((enabled) => {
        if (enabled) {
          next();
          return;
        }
        res.status(404).json({ message: 'Service not found' });
      })
      .catch((error: unknown) => {
        // The evaluator already degrades internally (stale/default); reaching
        // here means something unexpected — do not take the whole API down.
        this.logger.warn(`Universe gate check failed for ${slug}, passing through: ${error}`);
        next();
      });
  }

  /** Extracts the gated universe slug from `/api[/vN]/<service>/...` paths. */
  private matchUniverse(path: string): string | null {
    const match = /^\/api\/(?:v\d+\/)?([^/?]+)/.exec(path);
    const service = match?.[1];
    if (!service) return null;
    return GATED_SERVICE_SLUGS[service] ?? null;
  }
}
