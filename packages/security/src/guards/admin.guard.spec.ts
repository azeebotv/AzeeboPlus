import { ForbiddenException } from '@nestjs/common';
import { AdminGuard } from './admin.guard';

describe('AdminGuard', () => {
  const makeContext = (headers: Record<string, string | undefined>, user?: unknown) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ headers, user }),
      }),
    }) as never;

  const guard = new AdminGuard({ verify: () => ({ sub: 'u1', role: 'admin' }) } as never);

  it('accepts identity established by an earlier guard (cookie-only SPA flow)', () => {
    const ctx = makeContext({ cookie: 'access_token=whatever' }, { id: 'u1', role: 'admin' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it("rejects roles outside the default allowlist ('user', 'superadmin')", () => {
    const ctx = makeContext({}, { id: 'u1', role: 'superadmin' });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(ctx)).toThrow('Insufficient permissions');
  });

  it('honors an allowedRoles option extension (e.g. superadmin)', () => {
    const guardSA = new AdminGuard({ verify: () => ({ sub: 'u1', role: 'superadmin' }) } as never, {
      allowedRoles: ['admin', 'superadmin'],
    });
    const ctx = makeContext({}, { sub: 'u1', role: 'superadmin' });
    expect(guardSA.canActivate(ctx)).toBe(true);
  });

  it('rejects established identity without an admin role', () => {
    const ctx = makeContext({}, { id: 'u1', role: 'user' });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(ctx)).toThrow('Insufficient permissions');
  });

  it('falls back to requiring an Authorization header when no identity was established', () => {
    const ctx = makeContext({});
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(ctx)).toThrow('Missing authorization header');
  });

  it('verifies Bearer tokens itself when no prior guard established identity', () => {
    const ctx = makeContext({ authorization: 'Bearer valid.token.here' });
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
