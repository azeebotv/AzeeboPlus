import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface AdminGuardOptions {
  allowedRoles?: string[];
}

@Injectable()
export class AdminGuard implements CanActivate {
  private allowedRoles: string[];

  constructor(
    private jwtService: JwtService,
    @Optional() private options?: AdminGuardOptions
  ) {
    this.allowedRoles = this.options?.allowedRoles ?? ['admin', 'ADMIN'];
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Identity already established by an earlier guard in the chain. When a
    // service registers ServiceAuthGuard as its global APP_GUARD (the standard
    // microservice pattern), it runs BEFORE this route guard and has verified
    // the caller — via gateway-forwarded x-user-* + x-gateway-secret, a Bearer
    // token, or the httpOnly access-token cookie — and stamped request.user.
    // Cookie-only SPA traffic (admin/creator panels) never carries an
    // Authorization header, so demanding one here would 403 every
    // gateway-proxied admin request from those panels.
    const established = request.user as { id?: string; sub?: string; role?: string } | undefined;
    if (established && (established.id || established.sub)) {
      if (
        !established.role ||
        !this.allowedRoles.some((role) => role.toLowerCase() === established.role!.toLowerCase())
      ) {
        throw new ForbiddenException('Insufficient permissions');
      }
      return true;
    }

    // No prior guard established identity: fall back to verifying the Bearer
    // token ourselves (direct access without the global ServiceAuthGuard).
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new ForbiddenException('Missing authorization header');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new ForbiddenException('Invalid authorization format');
    }

    try {
      const payload = this.jwtService.verify<{ sub: string; id: string; role?: string }>(token, {
        audience: 'azeebo-api',
        issuer: 'azeebo-auth',
      });
      request.user = payload;

      if (
        !payload.role ||
        !this.allowedRoles.some((role) => role.toLowerCase() === payload.role!.toLowerCase())
      ) {
        throw new ForbiddenException('Insufficient permissions');
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      // allowed-fabricated-4xx: token verification is pure client-input
      // handling — malformed, expired, and wrong-signature tokens all get
      // the same uniform 403 (anti-enumeration), and the cause cannot vary
      // beyond that, so mapAndThrow (which would map plain JWT errors to a
      // 500) is deliberately not used here.
      throw new ForbiddenException('Invalid or expired token');
    }
  }
}
