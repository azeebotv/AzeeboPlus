import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT guard for the standalone creator app.
 *
 * Two trusted paths:
 *  1. Behind the gateway: the gateway verified the JWT and forwarded identity
 *     via x-user-* headers stamped with x-gateway-secret. Passport has no
 *     bearer token to parse (SPA cookie flows), so trust the forwarded
 *     identity directly.
 *  2. Direct access: classic Bearer-token passport flow (local testing).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.headers?.['x-user-id'];
    const gatewaySecret = request.headers?.['x-gateway-secret'];
    const expected = process.env.GATEWAY_SECRET || process.env.INTERNAL_API_KEY;

    if (userId && expected && gatewaySecret === expected) {
      const role = request.headers?.['x-user-role'] || 'user';
      request.user = {
        id: userId,
        sub: userId,
        email: request.headers?.['x-user-email'] || '',
        role,
      };
      return true;
    }

    return (await super.canActivate(context)) as boolean;
  }
}
