import {Inject,  Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(@Inject(Reflector) private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowedRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!allowedRoles || allowedRoles.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user || !user.role) {
      throw new ForbiddenException('User role not found');
    }

    if (user.role === 'admin') {
      return true;
    }

    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenException(`Access denied. Required roles: ${allowedRoles.join(', ')}`);
    }

    return true;
  }
}
