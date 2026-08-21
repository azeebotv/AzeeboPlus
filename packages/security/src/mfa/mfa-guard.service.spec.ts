import { Reflector } from '@nestjs/core';
import { MfaGuard } from './mfa-guard.service';

describe('MfaGuard', () => {
  let guard: MfaGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new MfaGuard(reflector);
  });

  const createContext = (user?: Record<string, unknown>) => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    };
  };

  it('should allow access when no MFA required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(createContext() as never)).toBe(true);
  });

  it('should allow non-admin user without MFA', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const ctx = createContext({ id: 'user-1', role: 'user' });
    expect(guard.canActivate(ctx as never)).toBe(true);
  });

  it('should reject admin without MFA verification', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const ctx = createContext({ id: 'admin-1', role: 'admin', mfaVerified: false });

    expect(() => guard.canActivate(ctx as never)).toThrow('MFA verification required');
  });

  it('should allow admin with verified MFA', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const ctx = createContext({
      id: 'admin-1',
      role: 'admin',
      mfaVerified: true,
      mfaVerifiedAt: new Date(),
    });
    expect(guard.canActivate(ctx as never)).toBe(true);
  });

  it('should reject admin with expired MFA session', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const ctx = createContext({
      id: 'admin-1',
      role: 'admin',
      mfaVerified: true,
      mfaVerifiedAt: new Date(Date.now() - 31 * 60 * 1000), // 31 minutes ago
    });

    expect(() => guard.canActivate(ctx as never)).toThrow('MFA session expired');
  });

  it('should reject superadmin without MFA', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const ctx = createContext({ id: 'super-1', role: 'superadmin', mfaVerified: false });

    expect(() => guard.canActivate(ctx as never)).toThrow('MFA verification required');
  });

  it('should reject unauthenticated request', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const ctx = createContext(undefined);

    expect(() => guard.canActivate(ctx as never)).toThrow('Authentication required');
  });
});
