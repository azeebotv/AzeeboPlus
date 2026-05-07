import { z } from 'zod';

export const environmentSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  // Database
  DATABASE_URL: z.string().url(),
  DATABASE_HOST: z.string().default('localhost'),
  DATABASE_PORT: z.coerce.number().default(5432),
  DATABASE_USER: z.string().default('postgres'),
  DATABASE_PASSWORD: z.string(),
  DATABASE_NAME: z.string().default('azeebo_plus_dev'),

  // Redis
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('30m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  JWT_ISSUER: z.string().default('azeebo-plus'),
  JWT_AUDIENCE: z.string().default('azeebo-plus-users'),
  REFRESH_TOKEN_SECRET: z.string().min(32, 'REFRESH_TOKEN_SECRET must be at least 32 characters'),

  // API Gateway
  API_GATEWAY_PORT: z.coerce.number().default(3013),
  API_GATEWAY_URL: z.string().url().default('http://localhost:3013'),

  // Service URLs
  AUTH_SERVICE_URL: z.string().url().default('http://auth-service:3000'),
  USER_SERVICE_URL: z.string().url().default('http://user-service:3000'),
  WALLET_SERVICE_URL: z.string().url().default('http://wallet-service:3000'),
  PAYMENT_SERVICE_URL: z.string().url().default('http://payment-service:3000'),
  CONTENT_SERVICE_URL: z.string().url().default('http://content-service:3000'),
  NOTIFICATION_SERVICE_URL: z.string().url().default('http://notification-service:3000'),
  REWARD_SERVICE_URL: z.string().url().default('http://reward-service:3000'),
  SEARCH_SERVICE_URL: z.string().url().default('http://search-service:3000'),
  ANALYTICS_SERVICE_URL: z.string().url().default('http://analytics-service:3000'),
  MODERATION_SERVICE_URL: z.string().url().default('http://moderation-service:3000'),
  RECOMMENDATION_SERVICE_URL: z.string().url().default('http://recommendation-service:3000'),
  CREATOR_SERVICE_URL: z.string().url().default('http://creator-portal:3000'),
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
});

export type EnvironmentVariables = z.infer<typeof environmentSchema>;

export function validateEnvironment(env: Record<string, string | undefined>): EnvironmentVariables {
  const result = environmentSchema.safeParse(env);

  if (!result.success) {
    const errorMessages = result.error.issues.map((issue) => {
      const path = issue.path.join('.');
      return `${path}: ${issue.message}`;
    });

    throw new Error(`Invalid environment variables:\n${errorMessages.join('\n')}`);
  }

  // Production-specific validations
  if (result.data.NODE_ENV === 'production') {
    validateProductionEnvironment(result.data);
  }

  return result.data;
}

function validateProductionEnvironment(env: EnvironmentVariables): void {
  const errors: string[] = [];

  // Check JWT secret strength
  if (env.JWT_SECRET.length < 64) {
    errors.push('JWT_SECRET should be at least 64 characters in production');
  }

  if (env.REFRESH_TOKEN_SECRET.length < 64) {
    errors.push('REFRESH_TOKEN_SECRET should be at least 64 characters in production');
  }

  // Check for localhost database in production
  if (env.DATABASE_HOST === 'localhost' || env.DATABASE_HOST === '127.0.0.1') {
    errors.push('DATABASE_HOST cannot be localhost in production');
  }

  // Check for localhost redis in production
  if (env.REDIS_HOST === 'localhost' || env.REDIS_HOST === '127.0.0.1') {
    errors.push('REDIS_HOST cannot be localhost in production');
  }

  // Check that payment secrets are configured
  if (!env.PAYSTACK_SECRET_KEY && !env.FLUTTERWAVE_SECRET_KEY) {
    errors.push('At least one payment provider secret must be configured in production');
  }

  // Check allowed origins
  if (env.ALLOWED_ORIGINS.includes('localhost') || env.ALLOWED_ORIGINS === '*') {
    errors.push('ALLOWED_ORIGINS cannot include localhost or wildcard in production');
  }

  if (errors.length > 0) {
    throw new Error(`Production environment validation failed:\n${errors.join('\n')}`);
  }
}
