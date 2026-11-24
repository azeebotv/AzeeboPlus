import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Role-based access guard. Routes (or controllers) annotated with @Roles()
 * require the authenticated user to hold one of the listed roles; routes
 * without @Roles() pass through.
 *
 * Register after the authentication guard (ServiceAuthGuard / GatewayAuthGuard)
 * so request.user is populated:
 *   providers: [
 *     { provide: APP_GUARD, useClass: ServiceAuthGuard },
 *     { provide: APP_GUARD, useClass: RolesGuard },
 *   ]
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

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
