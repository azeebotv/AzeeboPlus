/**
 * Rate Limit Headers
 * API-005: Return X-RateLimit-* headers in responses
 */

export interface RateLimitHeaders {
  'X-RateLimit-Limit': string;
  'X-RateLimit-Remaining': string;
  'X-RateLimit-Reset': string;
}

export function createRateLimitHeaders(
  limit: number,
  remaining: number,
  resetTime: Date
): RateLimitHeaders {
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': Math.floor(resetTime.getTime() / 1000).toString(),
  };
}
