import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export interface CorsConfig {
  allowedOrigins: string[];
  allowedMethods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

const DEFAULT_CORS_CONFIG: Required<CorsConfig> = {
  allowedOrigins: [],
  allowedMethods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  credentials: true,
  maxAge: 86400,
};

export function createCorsConfig(config: CorsConfig): CorsOptions {
  const finalConfig = { ...DEFAULT_CORS_CONFIG, ...config };

  const originValidator = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void): void => {
    if (!origin) {
      if (process.env.NODE_ENV === 'production') {
        callback(new Error('CORS origin is required'));
        return;
      }
      callback(null, true);
      return;
    }

    if (finalConfig.allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    const isLocalhost = origin.match(/^http:\/\/localhost:\d+$/);
    if (isLocalhost && process.env.NODE_ENV !== 'production') {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} not allowed by CORS policy`), false);
  };

  return {
    origin: originValidator,
    methods: finalConfig.allowedMethods,
    allowedHeaders: finalConfig.allowedHeaders,
    exposedHeaders: finalConfig.exposedHeaders,
    credentials: finalConfig.credentials,
    maxAge: finalConfig.maxAge,
    optionsSuccessStatus: 204,
  };
}

export function requireAllowedOrigins(): string[] {
  const origins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];

  if (origins.length === 0 && process.env.NODE_ENV === 'production') {
    throw new Error('ALLOWED_ORIGINS environment variable is required in production');
  }

  return origins;
}
