export declare const CACHE_KEY_METADATA = 'cache_key';
export declare const CACHE_TTL_METADATA = 'cache_ttl';
export interface CacheOptions {
  key: string;
  ttl: number;
}
/**
 * Decorator to mark endpoints or methods for caching.
 *
 * @param options - Cache configuration with key pattern and TTL in seconds
 *
 * @example
 * @Cache({ key: 'user:profile:{userId}', ttl: 300 })
 * async getProfile(userId: string) { ... }
 *
 * @example
 * @Cache({ key: 'content:featured', ttl: 600 })
 * async getFeaturedContent() { ... }
 */
export declare const Cache: (
  options: CacheOptions
) => (target: object, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
