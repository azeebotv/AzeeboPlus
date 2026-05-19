import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rate_limit';

export enum RateLimitType {
  DEFAULT = 'default',
  AUTH = 'auth',
  PAYMENT = 'payment',
  SENSITIVE = 'sensitive',
  API = 'api',
}

export interface RateLimitConfig {
  type: RateLimitType;
  max?: number;
  windowMs?: number;
}

export const RateLimit = (config: RateLimitConfig | RateLimitType) => {
  const rateLimitConfig = typeof config === 'string' ? { type: config } : config;
  return SetMetadata(RATE_LIMIT_KEY, rateLimitConfig);
};

export const PublicRateLimit = (config: RateLimitConfig | RateLimitType) => {
  const rateLimitConfig = typeof config === 'string' ? { type: config } : config;
  return SetMetadata(RATE_LIMIT_KEY, { ...rateLimitConfig, public: true });
};
