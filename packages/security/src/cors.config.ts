import { INestApplication } from '@nestjs/common';

export interface CorsOptions {
  allowedOrigins: string[];
  credentials?: boolean;
  maxAge?: number;
}

export function configureCors(app: INestApplication, options: CorsOptions): void {
  const { allowedOrigins, credentials = true, maxAge = 3600 } = options;

  const validatedOrigins = allowedOrigins.map((origin) => {
    if (origin === '*') {
      throw new Error('CORS wildcard (*) is not allowed for security reasons');
    }

    try {
      new URL(origin);
      return origin;
    } catch {
      throw new Error(`Invalid CORS origin: ${origin}`);
    }
  });

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      if (!origin) {
        callback(new Error('Not allowed by CORS - missing origin header'));
        return;
      }

      const isAllowed = validatedOrigins.some((allowed) => {
        if (allowed.includes('*')) {
          const pattern = new RegExp(`^${allowed.replace(/\*/g, '[a-zA-Z0-9-]+')}$`);
          return pattern.test(origin);
        }
        return allowed === origin;
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS - origin: ${origin}`));
      }
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    credentials,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Request-ID',
      'Accept',
      'Origin',
    ],
    exposedHeaders: [
      'Content-Disposition',
      'X-Request-ID',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
    ],
    maxAge,
  });
}
