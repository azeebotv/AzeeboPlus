import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export type UserRole = 'USER' | 'ADMIN' | 'SUPPORT_AGENT' | 'MODERATOR' | 'CREATOR';

interface JwtPayload {
  sub: string;
  id: string;
  role?: UserRole;
}

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

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
      const payload = this.jwtService.verify<JwtPayload>(token);
      request.user = payload;

      const allowedRoles: UserRole[] = ['ADMIN'];
      if (!payload.role || !allowedRoles.includes(payload.role)) {
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