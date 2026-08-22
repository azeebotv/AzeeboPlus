/**
 * Hardened CORS Configuration
 * S-009: Verify allowed origins, add credentials handling
 */

export interface CorsConfig {
  origin: string | string[] | ((origin: string, callback: (err: Error | null, allow?: boolean) => void) => void);
  credentials: boolean;
  methods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  maxAge: number;
  preflightContinue: boolean;
  optionsSuccessStatus: number;
}

const ALLOWED_ORIGINS = [
  'https://azeeboplus.com',
  'https://www.azeeboplus.com',
  'https://creator.azeeboplus.com',
  'https://api.azeeboplus.com',
];

// Allow localhost in development/staging only
if (process.env.NODE_ENV !== 'production') {
  ALLOWED_ORIGINS.push(
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
  );
}

export const CORS_CONFIG: CorsConfig = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    // In production, reject unknown origins
    if (process.env.NODE_ENV === 'production') {
      return callback(new Error(`CORS: Origin ${origin} not allowed`), false);
    }
    // Allow in non-production for development flexibility
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Request-ID',
    'X-Correlation-ID',
    'X-CSRF-Token',
    'X-Forwarded-For',
    'Idempotency-Key',
  ],
  exposedHeaders: [
    'X-Request-ID',
    'X-Correlation-ID',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-Total-Count',
    'X-Page-Count',
  ],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204,
};
