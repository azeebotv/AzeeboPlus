import { CanActivate, ExecutionContext, Injectable, ConflictException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Guard that enforces idempotency on mutating (POST/PUT/PATCH) routes.
 * Clients must send an `Idempotency-Key` header. The key is stored in
 * request metadata for downstream services to persist in Redis/DB.
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
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const method = request.method?.toUpperCase();

    // Only enforce on mutating methods
    if (!['POST', 'PUT', 'PATCH'].includes(method)) {
      return true;
    }

    // Skip if route is marked @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
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
    if (idempotencyKey.length < 8 || idempotencyKey.length > 255) {
      throw new ConflictException('Idempotency-Key must be between 8 and 255 characters.');
    }

    // Attach to request for downstream Redis persistence
    request.idempotencyKey = idempotencyKey;
    return true;
  }
}
