import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type Redis from 'ioredis';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

const IDEMPOTENCY_PREFIX = 'idempotency:';
const IDEMPOTENCY_TTL_SECONDS = 86400; // 24 hours

/**
 * Guard that enforces idempotency on mutating (POST/PUT/PATCH) routes.
 * Clients must send an `Idempotency-Key` header. The key is checked against
 * Redis to detect duplicate requests. On first occurrence the key is stored
 * with a 24-hour TTL so retries within that window are rejected.
 *
 * Usage:
 *   @UseGuards(IdempotencyGuard)
 *   @Post('charge')
 *   async charge(@Body() dto: ChargeDto) { ... }
 *
 * The Redis client is self-managed (lazily created from REDIS_URL, mirroring
 * the gateway's AuthThrottlerGuard) so a service can wire the guard without
 * provider plumbing. Without REDIS_URL — or while Redis is unreachable — the
 * guard runs fail-open: the header is still required, but dedupe is left to
 * the service's DB-level idempotency key (data-integrity concern, not a
 * security boundary).
 */
@Injectable()
export class IdempotencyGuard implements CanActivate {
  private readonly logger = new Logger(IdempotencyGuard.name);
  private readonly redis: Redis | null = null;

  constructor(private readonly reflector: Reflector) {
    if (!process.env.REDIS_URL) {
      return;
    }
    try {
      // Lazy `require` so test graphs and Redis-less deployments never
      // construct a connection.
      const RedisCtor = require('ioredis');
      this.redis = new RedisCtor(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        enableOfflineQueue: false,
        lazyConnect: true,
      });
      // Keep the client reference on errors: ioredis reconnects on its own
      // (retryStrategy is event-driven and survives a failed initial
      // connect()). Health is re-derived at call time.
      this.redis!.on('error', (err: Error) => {
        this.logger.error(
          `Redis idempotency store error — dedupe degraded to fail-open (DB-level idempotency remains). Error: ${err.message}`
        );
      });
      this.redis!.connect().catch((err: Error) => {
        this.logger.error(
          `Redis idempotency store connect failed — dedupe degraded to fail-open. Error: ${err.message}`
        );
      });
    } catch {
      this.logger.warn('ioredis not available — IdempotencyGuard runs fail-open');
      this.redis = null;
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const method = request.method?.toUpperCase();

    // Only enforce on mutating methods
    if (!['POST', 'PUT', 'PATCH'].includes(method)) {
      return true;
    }

    // Skip if route is marked @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const idempotencyKey = request.headers['idempotency-key'];
    if (!idempotencyKey || typeof idempotencyKey !== 'string') {
      throw new ConflictException(
        'Missing Idempotency-Key header. All mutating requests must include a unique Idempotency-Key.'
      );
    }

    // Validate key format (UUID v4 preferred, but any non-empty string accepted)
    if (idempotencyKey.length < 4 || idempotencyKey.length > 255) {
      throw new ConflictException('Idempotency-Key must be between 4 and 255 characters.');
    }

    if (this.redis) {
      const redisKey = `${IDEMPOTENCY_PREFIX}${idempotencyKey}`;
      try {
        const existing = await this.redis.get(redisKey);
        if (existing) {
          throw new ConflictException(
            'Request with this Idempotency-Key has already been processed.'
          );
        }

        // Reserve the key atomically; NX prevents race conditions between
        // concurrent requests
        const reserved = await this.redis.set(
          redisKey,
          'processing',
          'EX',
          IDEMPOTENCY_TTL_SECONDS,
          'NX'
        );
        if (!reserved) {
          throw new ConflictException(
            'Request with this Idempotency-Key has already been processed.'
          );
        }
      } catch (error) {
        if (error instanceof ConflictException) {
          throw error;
        }
        this.logger.error(`Redis idempotency check failed: ${error}`);
        // Fail open — let downstream service handle deduplication via DB
        // idempotency key. RATIONALE: Idempotency is a data-integrity concern,
        // not a security boundary. Failing closed would block legitimate
        // requests when Redis is down. The payment-service and wallet-service
        // both have DB-level idempotency checks as a second line of defense.
        // RateLimiter fails closed because it IS a security boundary.
      }
    }

    // Attach to request for downstream services
    request.idempotencyKey = idempotencyKey;
    return true;
  }
}
