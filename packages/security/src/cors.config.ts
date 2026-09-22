import { INestApplication } from '@nestjs/common';

export interface CorsOptions {
  allowedOrigins: string[];
  credentials?: boolean;
  maxAge?: number;
  /** If true, allow requests without an Origin header (server-to-server). Default: true */
  allowMissingOrigin?: boolean;
}

export function configureCors(app: INestApplication, options: CorsOptions): void {
  const { allowedOrigins, credentials = true, maxAge = 3600, allowMissingOrigin = true } = options;

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
        // Allow requests without origin (server-to-server, curl, etc.)
        // when allowMissingOrigin is true (default). Set to false for
        // user-facing endpoints to prevent CORS bypass.
        if (allowMissingOrigin) {
          callback(null, true);
        } else {
          callback(new Error('CORS: Missing Origin header — not allowed for this endpoint'));
        }
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
      'X-Feature-Flag',
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
