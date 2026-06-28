import { z } from 'zod';

// Preprocess: normalize CORS_ORIGIN into ALLOWED_ORIGINS (used in .env.production)
function normalizeCorsOrigin(env: Record<string, string | undefined>): Record<string, string | undefined> {
  if (!env.ALLOWED_ORIGINS && env.CORS_ORIGIN) {
    return { ...env, ALLOWED_ORIGINS: env.CORS_ORIGIN };
  }
  return env;
}

export const environmentSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  // Database
  DATABASE_URL: z.string().url(),
  DATABASE_HOST: z.string().default('localhost'),
  DATABASE_PORT: z.coerce.number().default(5432),
  DATABASE_USER: z.string().default('postgres'),
  DATABASE_PASSWORD: z.string().default(''),
  DATABASE_NAME: z.string().default('azeebo_plus_dev'),

  // Redis
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  JWT_ISSUER: z.string().default('azeebo-auth'),
  JWT_AUDIENCE: z.string().default('azeebo-api'),

  // API Gateway
  API_GATEWAY_PORT: z.coerce.number().default(3013),
  API_GATEWAY_URL: z.string().url().default('http://localhost:3013'),

  // Service URLs
  AUTH_SERVICE_URL: z.string().url().default('http://auth-service:3000'),
  USER_SERVICE_URL: z.string().url().default('http://user-service:3001'),
  WALLET_SERVICE_URL: z.string().url().default('http://wallet-service:3002'),
  PAYMENT_SERVICE_URL: z.string().url().default('http://payment-service:3003'),
  CONTENT_SERVICE_URL: z.string().url().default('http://content-service:3004'),
  NOTIFICATION_SERVICE_URL: z.string().url().default('http://notification-service:3006'),
  REWARD_SERVICE_URL: z.string().url().default('http://reward-service:3007'),
  SEARCH_SERVICE_URL: z.string().url().default('http://search-service:3005'),
  ANALYTICS_SERVICE_URL: z.string().url().default('http://analytics-service:3008'),
  MODERATION_SERVICE_URL: z.string().url().default('http://moderation-service:3022'),
  RECOMMENDATION_SERVICE_URL: z.string().url().default('http://recommendation-service:3009'),
  CREATOR_SERVICE_URL: z.string().url().default('http://creator-service:3018'),
  LIFESTYLE_SERVICE_URL: z.string().url().default('http://lifestyle-service:3016'),
  VERTICAL_SERVICE_URL: z.string().url().default('http://vertical-service:3017'),
  QUEUE_SERVICE_URL: z.string().url().default('http://queue-service:3015'),
  MEDIA_SERVICE_URL: z.string().url().default('http://media-service:3019'),

  // Payment Providers
  PAYSTACK_SECRET_KEY: z.string().optional(),
  PAYSTACK_WEBHOOK_SECRET: z.string().optional(),
  FLUTTERWAVE_SECRET_KEY: z.string().optional(),
  FLUTTERWAVE_WEBHOOK_SECRET: z.string().optional(),

  // Notification Providers
  SENDGRID_API_KEY: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),

  // AWS
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_S3_BUCKET: z.string().optional(),
  CDN_URL: z.string().url().optional(),

  // CORS
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),

  // Security
  ADMIN_EMAIL: z.string().email().optional(),

  // All-in-one mode (disables localhost restrictions for single-container deployments)
  ALL_IN_ONE: z.string().optional(),
});

export type EnvironmentVariables = z.infer<typeof environmentSchema>;

export class EnvValidationError extends Error {
  constructor(
    public missing: string[],
    public invalid: string[]
  ) {
    super('Environment validation failed');
    this.name = 'EnvValidationError';
  }
}

export function validateEnvironment(env: Record<string, string | undefined>): EnvironmentVariables {
  const normalized = normalizeCorsOrigin(env);
  const result = environmentSchema.safeParse(normalized);

  if (!result.success) {
    const missing: string[] = [];
    const invalid: string[] = [];

    result.error.issues.forEach((issue) => {
      const path = issue.path.join('.');
      if (issue.code === 'invalid_type' || issue.code === 'unrecognized_keys') {
        invalid.push(`${path}: ${issue.message}`);
      } else {
        missing.push(path);
      }
    });

    throw new EnvValidationError(missing, invalid);
  }

  // Production-specific validations
  if (result.data.NODE_ENV === 'production') {
    validateProductionEnvironment(result.data);
  }

  return result.data;
}

function validateProductionEnvironment(env: EnvironmentVariables): void {
  const errors: string[] = [];
  const isAllInOne = env.ALL_IN_ONE === 'true';

  // Check JWT secret strength
  if (env.JWT_ACCESS_SECRET.length < 64) {
    errors.push('JWT_ACCESS_SECRET should be at least 64 characters in production');
  }

  if (env.JWT_REFRESH_SECRET.length < 64) {
    errors.push('JWT_REFRESH_SECRET should be at least 64 characters in production');
  }

  // Check that payment secrets are configured
  if (!env.PAYSTACK_SECRET_KEY && !env.FLUTTERWAVE_SECRET_KEY) {
    errors.push('At least one payment provider secret must be configured in production');
  }

  // Check payment webhook secrets
  if (env.PAYSTACK_SECRET_KEY && !env.PAYSTACK_WEBHOOK_SECRET) {
    errors.push('PAYSTACK_WEBHOOK_SECRET must be configured when PAYSTACK_SECRET_KEY is set');
  }

  if (env.FLUTTERWAVE_SECRET_KEY && !env.FLUTTERWAVE_WEBHOOK_SECRET) {
    errors.push('FLUTTERWAVE_WEBHOOK_SECRET must be configured when FLUTTERWAVE_SECRET_KEY is set');
  }

  // Check allowed origins (skip localhost check in all-in-one mode)
  if (!isAllInOne && (env.ALLOWED_ORIGINS.includes('localhost') || env.ALLOWED_ORIGINS === '*')) {
    errors.push('ALLOWED_ORIGINS cannot include localhost or wildcard in production');
  }

  // Check that ALLOWED_ORIGINS is properly configured
  if (!env.ALLOWED_ORIGINS || env.ALLOWED_ORIGINS.trim() === '') {
    errors.push('ALLOWED_ORIGINS must be configured in production');
  }

  // Check AWS credentials if S3 bucket is configured
  if (env.AWS_S3_BUCKET && (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY)) {
    errors.push(
      'AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be configured when AWS_S3_BUCKET is set'
    );
  }

  // Check notification provider credentials (skip in all-in-one mode - can be configured later)
  if (!isAllInOne && !env.SENDGRID_API_KEY && !env.TWILIO_ACCOUNT_SID) {
    errors.push(
      'At least one notification provider (SendGrid or Twilio) must be configured in production'
    );
  }

  if (env.TWILIO_ACCOUNT_SID && (!env.TWILIO_AUTH_TOKEN || !env.TWILIO_PHONE_NUMBER)) {
    errors.push(
      'TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER must be configured when TWILIO_ACCOUNT_SID is set'
    );
  }

  // Check that service URLs are not localhost (skip in all-in-one mode)
  if (!isAllInOne) {
    const serviceUrls: Array<keyof EnvironmentVariables> = [
      'AUTH_SERVICE_URL',
      'USER_SERVICE_URL',
      'WALLET_SERVICE_URL',
      'PAYMENT_SERVICE_URL',
      'CONTENT_SERVICE_URL',
      'NOTIFICATION_SERVICE_URL',
      'REWARD_SERVICE_URL',
      'SEARCH_SERVICE_URL',
      'ANALYTICS_SERVICE_URL',
      'MODERATION_SERVICE_URL',
      'RECOMMENDATION_SERVICE_URL',
      'CREATOR_SERVICE_URL',
      'LIFESTYLE_SERVICE_URL',
      'VERTICAL_SERVICE_URL',
      'QUEUE_SERVICE_URL',
      'MEDIA_SERVICE_URL',
    ];

    serviceUrls.forEach((urlName) => {
      const url = env[urlName];
      if (typeof url === 'string' && (url.includes('localhost') || url.includes('127.0.0.1'))) {
        errors.push(`${urlName} cannot point to localhost in production`);
      }
    });
  }

  if (errors.length > 0) {
    throw new Error(`Production environment validation failed:\n${errors.join('\n')}`);
  }
}
