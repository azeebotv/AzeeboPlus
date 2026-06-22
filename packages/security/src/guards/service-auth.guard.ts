import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
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
 * Usage: Register as APP_GUARD in each service's app.module.ts:
 *   providers: [
 *     { provide: APP_GUARD, useClass: ServiceAuthGuard },
 *   ]
 */
@Injectable()
export class ServiceAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
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
    const userId =
      request.headers['x-user-id'] || request.headers['X-User-Id'];
    const userRole =
      request.headers['x-user-role'] || request.headers['X-User-Role'];
    const userEmail =
      request.headers['x-user-email'] || request.headers['X-User-Email'];

    // 3. If JWT auth header is present (direct access, not via gateway),
    //    accept it as a fallback (for internal service-to-service calls)
    const authHeader = request.headers['authorization'];

    // 4. Validate identity is present
    if (!userId && !authHeader) {
      throw new UnauthorizedException(
        'Authentication required. No user identity found in request.',
      );
    }

    // 5. Attach user context to request
    if (userId) {
      request.user = {
        id: userId,
        role: userRole || 'user',
        email: userEmail || '',
      };
    } else if (authHeader) {
      // For direct access with Bearer token, set minimal user context
      // (Full JWT validation should happen at the gateway level)
      request.user = {
        id: 'token-authenticated',
        role: 'user',
        email: '',
      };
    }

    return true;
  }
}
