"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cache = exports.CACHE_TTL_METADATA = exports.CACHE_KEY_METADATA = void 0;
const common_1 = require("@nestjs/common");
exports.CACHE_KEY_METADATA = 'cache_key';
exports.CACHE_TTL_METADATA = 'cache_ttl';
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
const Cache = (options) => {
    return (target, propertyKey, descriptor) => {
        (0, common_1.SetMetadata)(exports.CACHE_KEY_METADATA, options.key)(target, propertyKey, descriptor);
        (0, common_1.SetMetadata)(exports.CACHE_TTL_METADATA, options.ttl)(target, propertyKey, descriptor);
        return descriptor;
    };
};
exports.Cache = Cache;
