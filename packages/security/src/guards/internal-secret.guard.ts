import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { timingSafeEqual } from 'crypto';

/**
 * Guard for internal service-to-service routes.
 *
 * Nest's route guards run BEFORE the APP_GUARD (global guards), and this
 * guard's routes intentionally carry no user identity — they are machine
 * calls (tip debit/credit, lookups by userId) where the caller authenticates
 * with the shared internal secret instead of a user JWT or forwarded
 * gateway headers. ServiceAuthGuard would reject such requests with 401, so
 * mark these routes @Public() and enforce the shared secret here.
 *
 * Accepted header: `x-internal-api-key`, compared (timing-safe) against
 * GATEWAY_SECRET, falling back to INTERNAL_API_KEY — the same resolution
 * order ServiceAuthGuard uses for forwarded-identity requests.
 */
@Injectable()
export class InternalSecretGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const provided = request.headers['x-internal-api-key'];

    const expected = process.env.GATEWAY_SECRET || process.env.INTERNAL_API_KEY;
    if (!expected) {
      throw new ForbiddenException(
        'Internal authentication not configured. Set GATEWAY_SECRET (or INTERNAL_API_KEY) to accept internal service calls.'
      );
    }

    if (typeof provided !== 'string' || !provided) {
      throw new ForbiddenException('Missing x-internal-api-key header');
    }

    const providedBuffer = Buffer.from(provided);
    const expectedBuffer = Buffer.from(expected);
    if (
      providedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(providedBuffer, expectedBuffer)
    ) {
      throw new ForbiddenException('Invalid x-internal-api-key');
    }

    return true;
  }
}
