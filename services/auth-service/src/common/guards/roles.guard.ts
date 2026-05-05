import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly allowedRoles: string[]) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user || !user.role) {
      throw new ForbiddenException('User role not found');
    }

    if (!this.allowedRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${this.allowedRoles.join(', ')}`
      );
    }

    return true;
  }
}
