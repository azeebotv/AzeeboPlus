import { Injectable, Inject, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(@Inject(Reflector) private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || !user.role) {
      return false;
    }
    const userRole = String(user.role).toLowerCase().replace(/[-_]/g, '');
    const isSuperAdmin = userRole === 'superadmin';
    if (isSuperAdmin) {
      return true;
    }
    const normalizedRoles = roles.map((r) => String(r).toLowerCase().replace(/[-_]/g, ''));
    return normalizedRoles.includes(userRole);
  }
}
