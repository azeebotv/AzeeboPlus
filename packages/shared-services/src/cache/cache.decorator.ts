import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY_METADATA = 'cache_key';
export const CACHE_TTL_METADATA = 'cache_ttl';

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
export const Cache = (options: CacheOptions) => {
  return (
    target: object,
    propertyKey?: string | symbol,
    descriptor?: TypedPropertyDescriptor<(...args: unknown[]) => Promise<unknown>>
  ) => {
    if (descriptor) {
      SetMetadata(CACHE_KEY_METADATA, options.key)(descriptor.value);
      SetMetadata(CACHE_TTL_METADATA, options.ttl)(descriptor.value);
      return descriptor;
    }

    // For class decorators, apply metadata to the constructor
    SetMetadata(CACHE_KEY_METADATA, options.key)(target);
    SetMetadata(CACHE_TTL_METADATA, options.ttl)(target);
    return target;
  };
};
