import { INestApplication } from '@nestjs/common';

export interface CorsOptions {
  allowedOrigins: string[];
  credentials?: boolean;
  maxAge?: number;
  /**
   * If true, CORS headers are also emitted for requests that carry no Origin
   * header. Browsers always attach Origin to CORS-eligible requests, and
   * same-origin traffic ignores CORS headers entirely, so the default of
   * false keeps origin-less responses free of Access-Control-* headers.
   * Default: false
   */
  allowMissingOrigin?: boolean;
}

export function configureCors(app: INestApplication, options: CorsOptions): void {
  const { allowedOrigins, credentials = true, maxAge = 3600, allowMissingOrigin = false } = options;

  const validatedOrigins = allowedOrigins.map((origin) => {
    if (origin === '*') {
      throw new Error('CORS wildcard (*) is not allowed for security reasons');
    }

    try {
      new URL(origin);
      return origin;
    } catch {
      // allowed-fabricated-4xx: boot-time config validation in the security
      // package — a malformed origin list must fail process startup loudly,
      // not become an HTTP response; there is no request in flight.
      throw new Error(`Invalid CORS origin: ${origin}`);
    }
  });

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      if (!origin) {
        // No hard rejection here: health probes and same-origin GETs legitimately
        // omit Origin, and CORS is browser-enforced anyway. Simply withholding the
        // Access-Control-* headers keeps origin-less responses from advertising
        // cross-origin credentialed access.
        callback(null, allowMissingOrigin);
        return;
      }

      const isAllowed = validatedOrigins.some((allowed) => allowed === origin);

      if (isAllowed) {
        callback(null, true);
      } else {
        // Standard CORS denial: respond without Access-Control-Allow-Origin
        // and let the browser enforce the block. Passing an Error here would
        // abort the request entirely and surface as a 500 to every
        // non-allowlisted client (including same-origin-proxied upstreams
        // whose dev ports drift off the allowlist).
        callback(null, false);
      }
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    credentials,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Request-ID',
      'X-Correlation-Id',
      'X-CSRF-Token',
      'Idempotency-Key',
      // The web app keys anonymous feature-flag rollout buckets with this id
      // (GET /feature-flags/bootstrap); omitting it fails the preflight, so the
      // whole flag bootstrap is blocked in the browser rather than degrading.
      'X-Anonymous-Id',
      'Accept',
      'Origin',
    ],
    exposedHeaders: [
      'Content-Disposition',
      'X-Request-ID',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      // Clients bootstrap CSRF by reading the token minted on GET responses
      // (the _csrf cookie is httpOnly, so this header is the only readable
      // source for cross-origin SPAs like the public web app).
      'X-CSRF-Token',
      // 429 handling reads Retry-After to schedule the retry.
      'Retry-After',
    ],
    maxAge,
  });
}
