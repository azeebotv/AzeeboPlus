import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisService } from '../redis/redis.service';

export const MFA_REQUIRED_KEY = 'mfa_required';
export const MFA_REQUIRED = () => {
  return (target: any, key?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      return Reflect.defineMetadata(MFA_REQUIRED_KEY, true, descriptor.value);
    }
    return Reflect.defineMetadata(MFA_REQUIRED_KEY, true, target);
  };
};

@Injectable()
export class MfaGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const handler = context.getHandler();
    const controller = context.getClass();

    const mfaRequired =
      this.reflector.get<boolean>(MFA_REQUIRED_KEY, handler) ||
      this.reflector.get<boolean>(MFA_REQUIRED_KEY, controller);

    if (!mfaRequired) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const client = await this.redisService.getClient();
    const mfaVerifiedKey = `mfa_verified:${user.userId}`;
    const isVerified = await client.get(mfaVerifiedKey);

    if (!isVerified) {
      throw new ForbiddenException('MFA verification required for this operation');
    }

    return true;
  }
}
