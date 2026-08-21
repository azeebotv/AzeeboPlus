import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// ============================================================================
// MFA Guard for Admin Actions (TAA §49)
// ============================================================================

export const REQUIRES_MFA_KEY = 'requires_mfa';

/**
 * Decorator to mark an endpoint as requiring MFA verification.
 * Usage: @RequiresMFA() or @UseGuards(MfaGuard)
 */
export const RequiresMFA = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (target: object, _propertyKey?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata(REQUIRES_MFA_KEY, true, descriptor.value);
      return descriptor;
    }
    Reflect.defineMetadata(REQUIRES_MFA_KEY, true, target);
    return target;
  };
};

/** MFA verification status attached to request by auth middleware */
interface MfaVerifiedRequest {
  user?: {
    id: string;
    role?: string;
    mfaVerified?: boolean;
    mfaVerifiedAt?: Date;
  };
}

/** MFA session timeout (30 minutes) */
const MFA_SESSION_TIMEOUT_MS = 30 * 60 * 1000;

@Injectable()
export class MfaGuard implements CanActivate {
  private readonly logger = new Logger(MfaGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if route requires MFA
    const requiresMfa = this.reflector.getAllAndOverride<boolean>(REQUIRES_MFA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiresMfa) {
      return true; // No MFA required
    }

    const request = context.switchToHttp().getRequest() as MfaVerifiedRequest;
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Admin users must have MFA
    if (user.role === 'admin' || user.role === 'superadmin') {
      if (!user.mfaVerified) {
        this.logger.warn(
          `MFA REQUIRED: Admin user ${user.id} attempted access without MFA verification`
        );
        throw new ForbiddenException('MFA verification required');
      }

      // Check MFA session timeout
      if (user.mfaVerifiedAt) {
        const timeSinceVerification = Date.now() - user.mfaVerifiedAt.getTime();
        if (timeSinceVerification > MFA_SESSION_TIMEOUT_MS) {
          this.logger.warn(
            `MFA EXPIRED: Admin user ${user.id} MFA session expired (${Math.round(timeSinceVerification / 60000)} minutes)`
          );
          throw new ForbiddenException('MFA session expired');
        }
      }
    }

    return true;
  }
}
