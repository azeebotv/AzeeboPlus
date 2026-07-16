import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { timingSafeEqual } from 'crypto';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Service-level auth guard for NestJS microservices behind the API gateway.
 *
 * The API gateway (GatewayAuthGuard) validates the JWT and forwards user
 * identity as `x-user-*` headers. This guard:
 *   1. Skips routes marked with @Public()
 *   2. Reads forwarded x-user-id / x-user-role / x-user-email headers
 *   3. Attaches user context to request.user
 *   4. Rejects requests missing user identity (401 Unauthorized)
 *
 * SECURITY: Forwarded x-user-* headers are only trusted when accompanied
 * by the x-gateway-secret header (shared secret between gateway and services).
 * Without it, requests must use Bearer token authentication.
 *
 * Usage: Register as APP_GUARD in each service's app.module.ts:
 *   providers: [
 *     { provide: APP_GUARD, useClass: ServiceAuthGuard },
 *   ]
 */
@Injectable()
export class ServiceAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Optional() private readonly jwtService?: JwtService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Check @Public() decorator on class or method
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // 2. Read forwarded user headers from gateway
    const userId = request.headers['x-user-id'] || request.headers['X-User-Id'];
    const userRole = request.headers['x-user-role'] || request.headers['X-User-Role'];
    const userEmail = request.headers['x-user-email'] || request.headers['X-User-Email'];
    const gatewaySecret = request.headers['x-gateway-secret'];

    // 3. If JWT auth header is present (direct access, not via gateway)
    const authHeader = request.headers['authorization'];

    // 4. Validate identity is present
    if (!userId && !authHeader) {
      throw new UnauthorizedException(
        'Authentication required. No user identity found in request.'
      );
    }

    // 5. Attach user context to request
    if (userId) {
      // SECURITY: Only trust forwarded headers if the gateway secret is valid.
      // This prevents direct attackers from spoofing user identity by setting
      // x-user-* headers without going through the gateway.
      const expectedSecret = process.env.GATEWAY_SECRET || process.env.INTERNAL_API_KEY;
      if (!expectedSecret) {
        // No gateway secret configured — do not trust forwarded headers.
        // Require direct JWT authentication instead.
        throw new UnauthorizedException(
          'Gateway authentication not configured. Requests with x-user-* headers require a valid x-gateway-secret.'
        );
      }
      // Use timing-safe comparison to prevent timing side-channel attacks
      const secretBuffer = Buffer.from(gatewaySecret || '');
      const expectedBuffer = Buffer.from(expectedSecret);
      if (
        secretBuffer.length !== expectedBuffer.length ||
        !timingSafeEqual(secretBuffer, expectedBuffer)
      ) {
        throw new UnauthorizedException(
          'Gateway authentication required. Requests with x-user-* headers must include a valid x-gateway-secret.'
        );
      }

      request.user = {
        id: userId,
        sub: userId,
        role: userRole || 'user',
        email: userEmail || '',
      };
    } else if (authHeader) {
      const [type, token] = authHeader.split(' ');

      if (type !== 'Bearer' || !token) {
        throw new UnauthorizedException('Invalid authorization header format.');
      }

      if (!this.jwtService) {
        throw new UnauthorizedException(
          'JWT verification unavailable. This service does not have JwtModule configured for direct token authentication.'
        );
      }

      try {
        const payload = this.jwtService.verify<{ sub: string; role?: string; email?: string }>(
          token,
          {
            audience: 'azeebo-api',
            issuer: 'azeebo-auth',
          }
        );

        request.user = {
          id: payload.sub,
          sub: payload.sub,
          role: payload.role || 'user',
          email: payload.email || '',
        };
      } catch {
        throw new UnauthorizedException('Invalid or expired token.');
      }
    }

    return true;
  }
}
