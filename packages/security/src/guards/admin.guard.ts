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

      if (!payload.role || !this.allowedRoles.some(role => role.toLowerCase() === payload.role!.toLowerCase())) {
        throw new ForbiddenException('Insufficient permissions');
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException('Invalid or expired token');
    }
  }
}
