import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
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
 * Or globally: register as APP_GUARD (only affects mutating routes).
 */
@Injectable()
export class IdempotencyGuard implements CanActivate {
  private readonly logger = new Logger(IdempotencyGuard.name);

  constructor(
    private readonly reflector: Reflector,
    @InjectRedis() private readonly redis: Redis
  ) {}

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

    // Check Redis for existing idempotency key
    const redisKey = `${IDEMPOTENCY_PREFIX}${idempotencyKey}`;
    try {
      const existing = await this.redis.get(redisKey);
      if (existing) {
        throw new ConflictException(
          'Request with this Idempotency-Key has already been processed.'
        );
      }

      // Reserve the key atomically; NX prevents race conditions between concurrent requests
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
      // Fail open — let downstream service handle deduplication via DB idempotency key.
      // RATIONALE: Idempotency is a data-integrity concern, not a security boundary.
      // Failing closed would block legitimate requests when Redis is down.
      // The payment-service and wallet-service both have DB-level idempotency checks
      // as a second line of defense. RateLimiter fails closed because it IS a security boundary.
    }

    // Attach to request for downstream services
    request.idempotencyKey = idempotencyKey;
    return true;
  }
}
